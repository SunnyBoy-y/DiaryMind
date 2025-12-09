import os
import glob
import wave
import torch
import numpy as np
import pyaudio
from ALT_pure.log.load_log import logger
from ALT_pure.config.load_config import config
TAG=__name__
MODEL_PATH=os.path.join(os.path.dirname(__file__), "../common/model/silero_vad")  # 就是你复制的文件夹
TEMP_PATH=os.path.join(os.path.dirname(__file__), "temp")

class VAD:
    ##
    # 用户接口：record_audio("这里填写文件名")
    # 使用示例:
    # '''
    # with VAD() as v:
    #    v.record_audio("test.wav")
    # '''
    # #
    def __init__(self):
        #初始化
        self.MODEL_PATH=MODEL_PATH
        self.TEMP_PATH=TEMP_PATH
        self.logger=logger.bind(tag=TAG)

        try:
            self.model, self.utils = torch.hub.load(
                repo_or_dir=self.MODEL_PATH,
                model="silero_vad",
                source="local",
                trust_repo=True
            )

            (self.get_speech_timestamps,
             self.save_audio,
             self.read_audio,
             self.VADIterator,
             self.collect_chunks) = self.utils
        except Exception as e:
            self.logger.warning(f"无法从本地加载Silero VAD模型: {e}")
            self.logger.warning("请检查模型文件是否正确")
            raise

        self.SAMPLE_RATE = 16000
        self.CHANNELS= 1
        self.DTYPE=np.int16
        self.CHUNK=512
        self.FORMAT=pyaudio.paInt16

        self.confidence=config.get("vad",{"confidence":0.5}).get("confidence",0.5)
        self.silence=config.get("vad",{"silence":1}).get("silence",1)
        self.timeout=config.get("vad",{"timeout":60}).get("timeout",60)
        self.max_temp_num=config.get("vad",{"max_temp_num":15}).get("max_temp_num",15)
        self.min_cont_frames=int(config.get("vad",{"min_cont_frames":5}).get("min_cont_frames",5))

        self.p=None
        self.stream=None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    def record_audio(self,filename:str="default_output.wav")->str:
        # 用户接口
        # 录音人声片段，人声静默1秒结束并且写入音频wav
        # 注意这里接受的filename不是路径，默认路径是【VAD】TEMP_PATH
        try:
            os.makedirs(self.TEMP_PATH,exist_ok=True)
            output_file=os.path.join(self.TEMP_PATH,filename)
        except Exception as e:
            self.logger.error(f"创建临时目录时发生错误:{e}")
            return ""
        try:
            if self.p is None:
                self.p = pyaudio.PyAudio()
            if self.stream is None:
                self.stream=self.p.open(
                format=self.FORMAT,
                channels=self.CHANNELS,
                rate=self.SAMPLE_RATE,
                input=True,
                frames_per_buffer=self.CHUNK
            )
        except Exception as e:
            self.logger.error(f"初始化音频流出错:{e}")
            return  ""

        self.logger.info("开启麦克风,等待人声...")
        frames=[]
        silent_frames=0
        speech_frames=0
        max_silent_frames=int(self.silence*self.SAMPLE_RATE/self.CHUNK)
        timeout_frames=int(self.timeout*self.SAMPLE_RATE/self.CHUNK)
        total_frames=0
        start_frames=None

        try:
            while total_frames<timeout_frames:
                data=self.stream.read(self.CHUNK)
                frames.append(data)
                total_frames+=1

                audio_chunk=np.frombuffer(data,dtype=self.DTYPE)
                speech_prob=self._trust_detection(audio_chunk)

                if speech_prob>self.confidence:
                    if start_frames is None:
                        start_frames=max(0,total_frames-10)
                    self.logger.info(
                        f"检测到人声 {(total_frames-start_frames) * self.CHUNK / self.SAMPLE_RATE:.2f} 秒，人声概率: {speech_prob:.2f}")

                    silent_frames=0
                    speech_frames+=1
                else:
                    if speech_frames>0:
                       silent_frames+=1

                if silent_frames>=max_silent_frames and speech_frames>self.min_cont_frames:
                    self.logger.success(
                        f"录音结束，已录制 {(total_frames-start_frames) * self.CHUNK / self.SAMPLE_RATE:.2f} 秒 ,录音文件: {output_file}")
                    break

            wf = wave.open(output_file, 'wb')
            wf.setnchannels(self.CHANNELS)
            wf.setsampwidth(self.p.get_sample_size(self.FORMAT))
            wf.setframerate(self.SAMPLE_RATE)
            wf.writeframes(b''.join(frames[start_frames:]))
            wf.close()
            self._audio_temp_manager(output_file)
            return output_file
        except Exception as e:
            self.logger.error(f"录音时发生错误:{e}")
            return ""


    def _audio_temp_manager(self, audio_path):
        # 临时文件管理，最多15个文件，删除最老的
        try:
            audio_dir = os.path.dirname(audio_path) or '.'
            os.makedirs(audio_dir, exist_ok=True)
            pattern = os.path.join(audio_dir, "*.wav")
            audio_files = glob.glob(pattern)

            if len(audio_files) > self.max_temp_num:
                audio_files.sort(key=lambda x: os.path.getmtime(x))
                files_to_delete = len(audio_files) - max(self.max_temp_num,0)
                for i in range(files_to_delete):
                    try:
                        os.remove(audio_files[i])
                        self.logger.success(f"删除旧的音频缓存:{audio_files[i]}")
                    except Exception as e:
                        self.logger.warning(f"删除旧的音频文件{audio_files[i]}失败:{e}")
        except Exception as e:
            self.logger.warning(f"管理临时音频文件出错:{e}")

    def _trust_detection(self,audio_chunk:np.ndarray)->float:
        # 人声置信度检测
        try:
            audio_float=torch.from_numpy(np.array(audio_chunk,copy=True)).float()/32768.0
            audio_float=audio_float.unsqueeze(0)

            with torch.no_grad():
                speech_prob = self.model(audio_float, self.SAMPLE_RATE)
                return speech_prob.item()
        except Exception as e:
            self.logger.warning(f"人声置信度检测时未知错误:{e}")
            return 0.0

    def close(self):
        if self.stream:
            try:
                self.stream.stop_stream()
                self.stream.close()
            except Exception as e:
                self.logger.error(f"关闭音频流时发生错误:{e}")
            finally:
                self.stream=None
        if self.p:
            try:
                self.p.terminate()
            except Exception as e:
                self.logger.error(f"关闭PyAudio时发生错误:{e}")
            finally:
                self.p=None


