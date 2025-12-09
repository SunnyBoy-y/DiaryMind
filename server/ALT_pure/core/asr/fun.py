import warnings
warnings.filterwarnings("ignore", message="Couldn't find ffmpeg or avconv - defaulting to ffmpeg, but may not work")
import os
import torchaudio
import logging
from funasr import AutoModel
from pathlib import Path
from ALT_pure.log.load_log import logger
from ALT_pure.config.load_config import config
import asyncio
from functools import partial
TAG=__name__

logging.getLogger("root").setLevel(logging.ERROR)
class FunASR:
    def __init__(self):
        self.logger = logger.bind(tag=TAG)
        self.model_path = Path(os.path.join(os.path.dirname(__file__), "../common/model/funasr"))
        self.vad_path = Path(os.path.join(os.path.dirname(__file__), "../common/model/fsmn_vad"))
        self.punc_path = Path(os.path.join(os.path.dirname(__file__), "../common/model/ct_punc"))
        self.model=None
        if config.get('asr',{'local':{'model': "none"}}).get('local',{'model': "none"}).get('model', "none") == "local":
            try:
                self.model=AutoModel(
                    model=self.model_path,
                    vad_model=self.vad_path,
                    punc_model=self.punc_path,
                    trust_remote_code=False,
                    disable_update=True,
                    disable_log=True,
                )
            except Exception as e:
                self.logger.error("local model 加载失败")
                self.model=None

    async def audio_to_text_local(self,audio_path):
        if self.model is None:
            self.logger.error("请先config配置模型,本次返回空")
            return ""
        if not os.path.exists(audio_path):
            self.logger.error(f"音频文件不存在: {audio_path}")
            return ""
        loop = asyncio.get_event_loop()
        audio_data = await loop.run_in_executor(
            None,
            partial(self.read_audio, sampling_rate=16000),
            audio_path
        )
        # audio_data = self.read_audio(audio_path, sampling_rate=16000)

        # res = self.model.generate(
        #     input=audio_data,
        #     batch_size_s=3000
        # )
        res = await loop.run_in_executor(
            None,
            partial(
                self.model.generate,
                input=audio_data,
                batch_size_s=3000
            )
        )
        if res is None:
            return ""

        return res[0]['text']

    async def get_time_pos_local(self,audio_path):
        if self.model is None:
            self.logger.error("请在config中将local的model设置为“local”,本次返回空")
            return []
        if not os.path.exists(audio_path):
            self.logger.error(f"音频文件不存在: {audio_path}")
            return []
        loop = asyncio.get_event_loop()
        audio_data = await loop.run_in_executor(
            None,
            partial(self.read_audio, sampling_rate=16000),
            audio_path
        )
        # audio_data = self.read_audio(audio_path, sampling_rate=16000)

        # res = self.model.generate(
        #     input=audio_data,
        #     batch_size_s=3000
        # )
        res = await loop.run_in_executor(
            None,
            partial(
                self.model.generate,
                input=audio_data,
                batch_size_s=3000
            )
        )

        return res

    @staticmethod
    def read_audio(path: str, sampling_rate: int = 16000):
        # 读取音频
        list_backends = torchaudio.list_audio_backends()

        assert len(list_backends) > 0, 'The list of available backends is empty, please install backend manually. \
                                        \n Recommendations: \n \tSox (UNIX OS) \n \tSoundfile (Windows OS, UNIX OS) \n \tffmpeg (Windows OS, UNIX OS)'

        try:
            effects = [
                ['channels', '1'],
                ['rate', str(sampling_rate)]
            ]

            wav, sr = torchaudio.sox_effects.apply_effects_file(path, effects=effects)
        except:
            wav, sr = torchaudio.load(path)

            if wav.size(0) > 1:
                wav = wav.mean(dim=0, keepdim=True)

            if sr != sampling_rate:
                transform = torchaudio.transforms.Resample(orig_freq=sr,
                                                           new_freq=sampling_rate)
                wav = transform(wav)
                sr = sampling_rate

        assert sr == sampling_rate
        return wav.squeeze(0)

# if __name__ == "__main__":
#     funasr = FunASR()
#     while True:
#         p=input("请输入:")
#         out=funasr.audio_to_text_local(Path(p))
#         print(out)
