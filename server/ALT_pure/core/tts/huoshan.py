import asyncio
import copy
import gzip
import json
import aiofiles
import websockets
from ...log.load_log import logger
from ...config.load_config import config
import uuid
import glob
from ...core.common.text_processor import TextProcessor
from ...core.common.task_manager import TaskManager
import os
from ...core.tts.gpt_sovits import GPTSoVITS
TAG=__name__
TEMP_PATH=os.path.join(os.path.dirname(__file__), "temp")

class TTS:
    def __init__(self):
        self.TEMP_PATH = TEMP_PATH
        self.logger = logger.bind(tag=TAG)
        self.text_processor = TextProcessor()

        self.platform = config.get("choose", {"tts": None}).get("tts", None)
        self.app_id=None
        self.token=None
        self.cluster=None

        self.voice_type=None
        self.speed_ratio=None
        self.volume_ratio=None
        self.pitch_ratio=None
        self.emotion=None

        self.max_temp_num = config.get("tts", {"huoshan": {"max_temp_num": 15}}).get("huoshan",{"max_temp_num": 15}).get("max_temp_num", 15)

        self._is_loaded=False
        self.ts_huoshan=None

        self.gpt_sovits=GPTSoVITS()
        self.ts_gpt=None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self._close()

    def text_to_audio(self,text:str,filename:str="output.wav"):
        # 用户接口，文本转语音
        if self.platform=="gpt_sovits":
            self._is_loaded=True
        else:
            if not self._is_loaded:
                if self.platform=="huoshan":
                    self._load_huoshan()
                if not self._check():
                    self.logger.error("请于config完整配置llm,未发送llm请求")
                    self._is_loaded=False
                    return False
                else:
                    self._is_loaded=True

        if self._is_loaded:
            self._audio_temp_manager()
            if self.platform=="huoshan":
                try:
                    asyncio.run(self._request_huoshan(text,filename))
                except Exception as e:
                    self.logger.error(f"huoshan请求失败:{e}")
                    return  False
                return True
            elif self.platform=="gpt_sovits":
                try:
                    asyncio.run(self._request_gpt_sovits(text,filename))
                except Exception as e:
                    self.logger.error(f"gpt_sovits请求失败:{e}")
                    return  False
                return True

            else:
                self.logger.warning("未选择tts平台或tts平台不被支持，未发送llm请求")
                return False
        else:
            return  False

    async def smart_request_huoshan(self,raw_text):
        # 当平台是gpt_sovits时，不需要进行huoshan的配置检查
        if self.platform!="gpt_sovits":
            if not self._is_loaded:
                if self.platform=="huoshan":
                    self._load_huoshan()
                if not self._check():
                    self.logger.error("请于config完整配置tts,未发送tts请求")
                    self._is_loaded=False
                    return None
                else:
                    self._is_loaded=True
        else:
            # 对于gpt_sovits平台，直接标记为已加载
            self._is_loaded=True

        if self._is_loaded:
            self._audio_temp_manager()
            if self.platform=="huoshan":
                if self.ts_huoshan is None:
                    # 这里的worker是并发量，默认是4，根据需求！api限制，不得超10，除非你充钱任性【Doge】
                    self.ts_huoshan = TaskManager(self._request_huoshan, max_workers=4, single=False)
                cleaned_text = self.text_processor.text_clean(raw_text)
                texts = self.text_processor.text_merger(self.text_processor.text_cutter_by_language(cleaned_text))
                pieces_num=len(texts)
                self.logger.info(f"文本切分为 {pieces_num} 段: {texts}")
                paths=[f"audio_pieces_{uuid.uuid4()}.wav" for i in range(pieces_num)]
                task1 = await self.ts_huoshan.add_group([(text, path) for (text,path) in zip(texts,paths)])
                # await self.ts_huoshan.cancel_group(task1)
                await self.ts_huoshan.wait_for_group(task1)
                results = await self.ts_huoshan.get_group_results(task1)
                # 检查是否有任何结果为None
                if any(result is None for result in results):
                    self.logger.error("部分TTS请求失败，返回了None结果")
                    return None
                return results
            elif self.platform == "gpt_sovits":
                if self.ts_gpt is None:
                    # 这里的worker是并发量，默认是4，根据需求！api限制，不得超10，除非你充钱任性【Doge】
                    self.ts_gpt = TaskManager(self._request_gpt_sovits, max_workers=4, single=False)
                cleaned_text = self.text_processor.text_clean(raw_text)
                texts = self.text_processor.text_merger(self.text_processor.text_cutter_by_language(cleaned_text))
                pieces_num=len(texts)
                self.logger.info(f"文本切分为 {pieces_num} 段: {texts}")
                paths=[f"audio_pieces_{uuid.uuid4()}.wav" for i in range(pieces_num)]
                task1 = await self.ts_gpt.add_group([(text, path) for (text,path) in zip(texts,paths)])
                # await self.ts_huoshan.cancel_group(task1)
                await self.ts_gpt.wait_for_group(task1)
                results = await self.ts_gpt.get_group_results(task1)
                # 检查是否有任何结果为None
                if any(result is None for result in results):
                    self.logger.error("部分GPT-SoVITS TTS请求失败，返回了None结果")
                    return None
                return results

            else:
                self.logger.warning("未选择tts平台或tts平台不被支持，未发送tts请求")
                return None

        else:
            return  None

    async def _request_gpt_sovits(self,text,filename):
        self._audio_temp_manager()
        try:
            os.makedirs(self.TEMP_PATH, exist_ok=True)
            output_file = os.path.join(self.TEMP_PATH, filename)
        except Exception as e:
            self.logger.error(f"创建TTS缓存文件夹时发生错误: {e}")
            return None
        # 调用GPT-SoVITS的text_to_speech方法，它会直接写入output_file
        try:
            await self.gpt_sovits.text_to_speech(text, output_file)
            # 如果成功执行且没有异常，说明文件已生成
            if os.path.exists(output_file):
                return output_file
            else:
                self.logger.error(f"GPT-SoVITS未能生成音频文件: {output_file}")
                return None
        except Exception as e:
            self.logger.error(f"GPT-SoVITS TTS请求失败: {e}")
            return None

    async def _request_huoshan(self,text,filename):
        self._audio_temp_manager()
        try:
            os.makedirs(self.TEMP_PATH,exist_ok= True)
            output_file=os.path.join(self.TEMP_PATH,filename)
        except Exception as e:
            self.logger.error(f"创建TTS缓存文件夹时发生错误: {e}")
            return None
        try:
            request_json=self._json_process(text)
            submit_json=copy.deepcopy(request_json)

            payload_bytes = json.dumps(submit_json).encode('utf-8')
            payload_bytes = gzip.compress(payload_bytes)
            default_header = bytearray(b'\x11\x10\x11\x00')
            full_client_request = bytearray(default_header)
            full_client_request.extend((len(payload_bytes)).to_bytes(4, 'big'))
            full_client_request.extend(payload_bytes)

            async with websockets.connect(
                    "wss://openspeech.bytedance.com/api/v1/tts/ws_binary",
                    additional_headers={"Authorization": f"Bearer; {self.token}"},
                    ping_interval=None
            ) as ws:
                await ws.send(full_client_request)
                async with aiofiles.open(output_file,'wb') as file:
                    while True:
                        res = await ws.recv()
                        payload, done = self._parse_response(res, file)
                        if payload is not None:
                            await file.write(payload)
                        if done:
                            break
            self.logger.success(f"TTS文件{filename}已保存至{output_file}")
            # self._audio_temp_manager(output_file)
            return output_file
        except Exception as e:
            self.logger.error(f"TTS请求发生错误: {e}")
            return None

    def _parse_response(self,res,file):
        header_size = res[0] & 0x0f
        message_type = res[1] >> 4
        payload = res[header_size * 4:]

        if message_type == 0xb:
            sequence_number = int.from_bytes(payload[:4], "big", signed=True)
            payload = payload[8:]
            return payload, sequence_number < 0
        elif message_type == 0xf:
            code = int.from_bytes(payload[:4], "big", signed=False)
            error_msg = payload[8:]
            error_msg = gzip.decompress(error_msg) if res[2] & 0x0f == 1 else error_msg
            self.logger.error(f"[TTS Error] Code: {code}, Message: {error_msg.decode('utf-8')}")
            # 返回正确的元组格式，表示已完成但有错误
            return None, True
        else:
            self.logger.warning(f"未知消息类型: {message_type}")
            # 返回正确的元组格式，表示已完成但有错误
            return None, True

    def _load_huoshan(self):
        self.app_id=config.get("tts",{"huoshan":{"app_id":None}}).get("huoshan",{"app_id":None}).get("app_id",None)
        self.token=config.get("tts",{"huoshan":{"token":None}}).get("huoshan",{"token":None}).get("token",None)
        self.cluster=config.get("tts",{"huoshan":{"cluster":None}}).get("huoshan",{"cluster":None}).get("cluster",None)
        self.voice_type=config.get("tts",{"huoshan":{"voice_type":  None}}).get("huoshan",{"voice_type":  None}).get("voice_type",None)
        self.speed_ratio=config.get("tts",{"huoshan":{"speed_ratio":  1.0}}).get("huoshan",{"speed_ratio":  1.0}).get("speed_ratio",1.0)
        self.volume_ratio=config.get("tts",{"huoshan":{"volume_ratio":  1.0}}).get("huoshan",{"volume_ratio":  1.0}).get("volume_ratio",1.0)
        self.pitch_ratio=config.get("tts",{"huoshan":{"pitch_ratio":  1.2}}).get("huoshan",{"pitch_ratio":  1.2}).get("pitch_ratio",1.2)
        self.emotion=config.get("tts",{"huoshan":{"emotion":  "neutral"}}).get("huoshan",{"emotion": "neutral"}).get("emotion","neutral")

    def _check(self)->bool:
        flag=True
        if self.platform is None or self.platform=="":
            self.logger.error("未选择tts平台")
            flag=False
        if self.app_id is None or self.app_id=="":
            self.logger.error("未配置app_id")
            flag=False
        if self.token is None or self.token=="":
            self.logger.error("未配置token")
            flag=False
        if self.cluster is None or self.cluster=="":
            self.logger.error("未配置cluster")
            flag=False
        if self.voice_type is None or self.voice_type=="":
            self.logger.error("未配置voice_type")
            flag=False
        if self.speed_ratio is None or self.speed_ratio=="":
            self.logger.error("未配置speed_ratio")
            flag=False
        if self.volume_ratio is None or self.volume_ratio=="":
            self.logger.error("未配置volume_ratio")
            flag=False
        if self.pitch_ratio is None or self.pitch_ratio=="":
            self.logger.error("未配置pitch_ratio")
            flag=False
        return flag


    def _json_process(self,text:str):
        request_json = {
            "app": {
                "appid": self.app_id,
                "token": self.token,
                "cluster": self.cluster
            },
            "user": {
                "uid": "388808087185088"
            },
            "audio": {
                "voice_type": str(self.voice_type),
                "encoding": "wav",
                "speed_ratio": int(self.speed_ratio),
                "volume_ratio": int(self.volume_ratio),
                "pitch_ratio": int(self.pitch_ratio),
                "emotion": str(self.emotion)
            },
            "request": {
                "reqid": str(uuid.uuid4()),
                "text": str(text),
                "text_type": "plain",
                "operation": "submit",
            }
        }
        return request_json

    def _audio_temp_manager(self, audio_path=None):
        # 临时文件管理，默认最多15个文件，删除最老的
        try:
            if audio_path is None:
                audio_dir = self.TEMP_PATH
            else:
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
                        self.logger.success(f"删除旧的TTS缓存:{audio_files[i]}")
                    except Exception as e:
                        self.logger.warning(f"删除旧的TTS文件{audio_files[i]}失败:{e}")
        except Exception as e:
            self.logger.warning(f"管理临时TTS音频文件出错:{e}")

    def _debug(self):
        self.logger.info(f"tts平台{self.platform}")
        self.logger.info(f"app_id{self.app_id}")
        self.logger.info(f"token{self.token}")
        self.logger.info(f"cluster{self.cluster}")
        self.logger.info(f"voice_type{self.voice_type}")
        self.logger.info(f"speed_ratio{self.speed_ratio}")
        self.logger.info(f"volume_ratio{self.volume_ratio}")
        self.logger.info(f"pitch_ratio{self.pitch_ratio}")

    def _close(self):
        pass


