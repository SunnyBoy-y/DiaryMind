import subprocess
import os
import simpleaudio as sa
from typing import List
from pathlib import Path
import imageio_ffmpeg
import glob
from ALT_pure.log.load_log import logger
TAG=__name__
OUT_PATH=Path(__file__).parent / "output"
class AudioProcessor:
    def __init__(self):
        self.logger=logger.bind(tag=TAG)
        self.OUT_PATH=OUT_PATH
        self.max_temp_num=50

    def play(self, audio_path):
        if audio_path is None:
            self.logger.warning(f"[播放失败]{audio_path} 不存在")
            return
        try:
            audio_path = Path(audio_path)
        except Exception as e:
            self.logger.warning(f"[播放失败]{audio_path} 不存在：{e}")
            return
        if audio_path.exists():
            wave_obj = sa.WaveObject.from_wave_file(str(audio_path))
            play_obj = wave_obj.play()
            play_obj.wait_done()
        else:
            self.logger.warning(f"[播放失败]{audio_path} 不存在")

    def merge_wav_files(self,audio_paths:List[str],filename:str="output.wav"):
        if audio_paths is None or audio_paths==[]:
            self.logger.warning("没有找到任何音频文件")
            return None
        true_files = []
        for fl in audio_paths:
            if fl is None:
                 continue
            pth = Path(fl)
            if pth.exists():
                true_files.append(str(pth))
        # print(true_files)
        if not true_files:
            self.logger.warning("没有任何可处理的有效的音频文件")
            return None

        output_path=self.OUT_PATH / f'{filename}'
        output_path_obj = Path(output_path)
        output_path_obj.parent.mkdir(parents=True, exist_ok=True)

        ffmpeg_executable = imageio_ffmpeg.get_ffmpeg_exe()
        if len(true_files)==1:
            cmd = [
                ffmpeg_executable,
                "-i", true_files[0],
                "-acodec", "pcm_s16le",
                "-ar", "16000",
                "-y",
                str(output_path_obj)
            ]
        else:
            temp_list_file = Path("temp_audio_list.txt").resolve()
            try:
                with open(temp_list_file, "w", encoding="utf-8", newline="") as fil:
                    for pth in true_files:
                        safe_path = Path(pth).resolve().as_posix()
                        fil.write(f"file '{safe_path}'\n")

                cmd = [
                    ffmpeg_executable,
                    "-f", "concat",
                    "-safe", "0",
                    "-i", str(temp_list_file),
                    "-acodec", "pcm_s16le",
                    "-ar", "16000",
                    "-y",
                    str(output_path_obj)
                ]
            except Exception as e:
                self.logger.warning(f"创建临时文件失败: {e}")
                return None
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", check=False)
            if result.returncode != 0:
                self.logger.warning(f"FFmpeg 错误:\n{result.stderr}")
                return None
            self.logger.success(f"音频合并完成: {output_path_obj}")
            self._audio_temp_manager(output_path_obj)
            return output_path_obj
        except Exception as e:
            self.logger.warning(f"执行失败: {e}")
            return None
        finally:
            if 'temp_list_file' in locals() and temp_list_file.exists():
                try:
                    os.remove(temp_list_file)
                except Exception as e:
                    self.logger.warning(f"删除临时文件失败: {e}")

    def _check_wav_file(self,file_path:str)->bool:
        pth=Path(file_path)
        if not pth.exists():
            return False
        if pth.stat().st_size==0:
            return False
        try:
            with open(pth, "rb") as fil:
                riff_header=fil.read(12)
                if riff_header.startswith(b"RIFF") and b"WAVE" in riff_header:
                    return True
        except Exception as e:
            self.logger.warning(f"{pth} 不是wav格式: {e}")
        return  False

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

