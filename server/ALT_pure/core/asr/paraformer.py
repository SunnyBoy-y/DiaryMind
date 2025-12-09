import asyncio
import time
from ALT_pure.config.load_config import config
from ALT_pure.log.load_log import logger
from dashscope.audio.asr import Recognition
import dashscope
from http import HTTPStatus
import os
from core.asr.vad import VAD
import uuid
from core.asr.fun import FunASR
TAG=__name__

class ASR:
    def __init__(self):
        self.logger=logger.bind(tag=TAG)
        
        self.platform=config.get("choose",{"asr":None}).get("asr",None)
        self.api_key=None
        self.model=None
        self.language=None

        self._is_loaded=False
        self.vad=None

        self.recognition=None
        self.funasr=FunASR()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self._cleanup()
    async def audio_to_text(self,input_audio_path:str=""):
        # 音频转文本，用户接口,传入音频路径则读取音频文件，否则则录制
        record_mood=False
        if input_audio_path=="":
            record_mood=True

        if not self._is_loaded:
            if self.platform=="paraformer":
                self._load_paraformer()
            if not self._check():
                self.logger.error("请于config完整配置asr,本次返回空文本")
                self._is_loaded=False
                return ""
            else:
                self._is_loaded=True

        if self._is_loaded:
            if record_mood:
                audio_path=self._record_audio()
            else:
                audio_path=input_audio_path

            if (audio_path == "")or (not os.path.exists(audio_path)):
                # print(audio_path)
                self.logger.warning(f"无效音频路径 {audio_path}，本次返回空文本")
                return ""
            else:
                if self.platform == "paraformer":
                    return await self._request_paraformer(audio_path)
                elif self.platform =="local":
                    return await self.funasr.audio_to_text_local(audio_path)
                else:
                    self.logger.warning("未选择asr平台或asr平台不被支持，本次返回空文本")
                    return ""

        return ""

    async def get_time_pos(self,input_audio_path:str=""):
        # 【数字人组件】用户接口,传入音频路径则读取音频文件，否则则录制，获取音频中的时间轴
        record_mood=False
        if input_audio_path=="":
            record_mood=True

        if not self._is_loaded:
            if self.platform=="paraformer":
                self._load_paraformer()
            if not self._check():
                self.logger.error("请于config完整配置asr,本次返回空文本")
                self._is_loaded=False
                return []
            else:
                self._is_loaded=True

        if self._is_loaded:
            if record_mood:
                audio_path=self._record_audio()
            else:
                audio_path=input_audio_path

            if (audio_path == "")or (not os.path.exists(audio_path)):
                # print(audio_path)
                self.logger.warning(f"无效音频路径 {audio_path}，本次返回空列表")
                return []
            else:
                if self.platform == "paraformer":
                    return await self._get_time_pos(audio_path),"paraformer"
                elif self.platform == "local":
                    return await self.funasr.get_time_pos_local(audio_path),"local"
                else:
                    self.logger.warning("未选择asr平台或asr平台不被支持，本次返回空列表")
                    return [],"paraformer"

        return ""

    @staticmethod
    def generate_filename():
        return str(uuid.uuid4().hex)

    def _record_audio(self)->str:
        # 录音人声片段，人声静默n秒结束并且写入音频wav
        # 注意这的filename是文件名，默认路径是【VAD】TEMP_PATH
        filename=f"record_audio_{self.generate_filename()}.wav"
        if not self.vad:
            self.vad=VAD()
        return self.vad.record_audio(filename)


    def _check(self)->bool:
        flag= True
        if self.platform =='local':
            return True
        if self.platform is None or self.platform=="":
            self.logger.warning("未选择asr平台")
            flag=False
        if self.api_key is None or self.api_key=="":
            self.logger.warning("未填写api_key")
            flag=False
        if self.model is None or self.model=="" or self.model== []:
            self.logger.warning("未填写model")
            flag=False
        return flag

    def _load_paraformer(self):
        self.api_key=config.get("asr",None).get("paraformer",None).get("api_key",None)
        self.model=config.get("asr",None).get("paraformer",None).get("model",None)
        self.language=config.get("asr",None).get("paraformer",None).get("language",None)
        if self.api_key:
            dashscope.api_key = self.api_key

    async def _request_paraformer(self, audio_path):
        try:
            if self.recognition is None:
                self.recognition = Recognition(
                    model=self.model,
                    format="wav",
                    sample_rate=16000,
                    language_hints=self.language,
                    disfluency_removal_enabled=False,
                    semantic_punctuation_enabled=True,
                    callback= None
                )


            loop=asyncio.get_event_loop()
            start_time=time.time()
            raw_result=await loop.run_in_executor(None,self.recognition.call,audio_path)
            end_time=time.time()
            # self.logger.info(f"paraformer请求耗时:{end_time-start_time}")

            if raw_result.status_code == HTTPStatus.OK:
                result = raw_result.get_sentence()
                if not result:
                    return ""
                else:
                    if isinstance(result, list) and len(result)>0 and isinstance(result[0], dict):
                        texts=[text['text'] for text in result if 'text' in text]
                        return ''.join(texts)


                    elif isinstance(result, list):
                        return ''.join(result)
                    else:
                        return result
            else:
                self.logger.warning(f"paraformer错误返回:{raw_result.status_code}")
                return ""
        except Exception as e:
            self.logger.warning(f"paraformer请求失败:{e}")
            return ""

    async def _get_time_pos(self, audio_path):
        try:
            if self.recognition is None:
                self.recognition = Recognition(
                    model=self.model,
                    format="wav",
                    sample_rate=16000,
                    language_hints=self.language,
                    timestamp_alignment_enabled=True,
                    disfluency_removal_enabled=False,
                    semantic_punctuation_enabled=True,
                    callback= None
                )


            loop=asyncio.get_event_loop()
            start_time=time.time()
            raw_result=await loop.run_in_executor(None,self.recognition.call,audio_path)
            end_time=time.time()
            # self.logger.info(f"paraformer请求耗时:{end_time-start_time}")

            if raw_result.status_code == HTTPStatus.OK:
                result = raw_result.get_sentence()
                if not result:
                    return []
                else:
                    # [[{},{}],[{}],[]]
                    # print(result)
                    if isinstance(result, list) and len(result)>0 and isinstance(result[0], dict):
                        texts=[text['words'] for text in result if 'words' in text]
                        return [dic for dices in texts for dic in dices]
                    elif isinstance(result, list):
                        return [dic for dic in result]
                    else:
                        return []
            else:
                self.logger.warning(f"paraformer错误返回:{raw_result.status_code}")
                return []
        except Exception as e:
            self.logger.warning(f"paraformer请求失败:{e}")
            return []

    def _debug(self):
        self.logger.info(f"paraformer参数:{self.platform}")
        self.logger.info(f"api_key:{self.api_key}")
        self.logger.info(f"model:{self.model}")
        self.logger.info(f"language:{self.language}")
        self.logger.info(f"is_loaded:{self._is_loaded}")

    def _cleanup(self):
        if self.vad:
            try:
                self.vad.close()
            except Exception as e:
                self.logger.warning(f"vad关闭失败:{e}")
                pass
            self.vad = None
        if self.recognition:
            self.recognition = None
