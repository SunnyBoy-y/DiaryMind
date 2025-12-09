import asyncio
import aiohttp
import os
from ALT_pure.config.load_config import config
from ALT_pure.log.load_log import logger

class GPTSoVITS:
    def __init__(self):
        self.logger = logger.bind(tag=__name__)
        default_ref_path = os.path.join(os.path.dirname(__file__), "ref.wav")
        self.ref_audio_path = config.get("tts", {}).get("gpt_sovits", {}).get("ref_path", default_ref_path)
        self.prompt_text = config.get("tts", {}).get("gpt_sovits", {}).get("prompt_text", "我可是很擅长解谜和推理的哦，要不要一起玩个游戏")
        self.top_k = config.get("tts", {}).get("gpt_sovits", {}).get("top_k", 5)
        self.top_p = config.get("tts", {}).get("gpt_sovits", {}).get("top_p", 1.0)
        self.temperature = config.get("tts", {}).get("gpt_sovits", {}).get("temperature", 1.0)

    def sync_function(self, text: str) -> str:
        """
        同步处理函数，用于处理文本到语音的同步调用
        
        Args:
            text (str): 需要转换为语音的文本
            
        Returns:
            str: 音频文件路径或标识符
        """
        try:
            self.logger.info(f"开始同步处理文本: {text}")
            
            # 调用现有的异步方法并等待结果
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            try:
                result = loop.run_until_complete(self.text_to_speech(text))
                self.logger.info("同步处理完成")
                return result
            finally:
                loop.close()
                
        except Exception as e:
            self.logger.error(f"同步处理过程中发生错误: {e}")
            return ""

    async def text_to_speech(self, text, output_file=None):
        """
        简化版GPT-SoVITS文本转语音函数，使用固定配置参数

        Args:
            text (str): 要转换的文本
            output_file (str, optional): 输出音频文件路径

        Returns:
            bytes: 音频数据（当output_file为None时）
            None: 保存到文件时
        """

        # 检查参考音频文件是否存在
        if not os.path.exists(self.ref_audio_path):
            raise FileNotFoundError(f"参考音频文件不存在: {self.ref_audio_path}")

        # 固定参数配置 (参考config_this.yaml中的GPT_SOVITS_V2配置)
        config_this = {
            "url": "http://127.0.0.1:9880/tts",
            "text_lang": "auto",
            "ref_audio_path": self.ref_audio_path,
            "prompt_text": self.prompt_text,
            "prompt_lang": "auto",
            "top_k": self.top_k,
            "top_p": self.top_p,
            "temperature": self.temperature,
            "batch_threshold": 0.75,
            "batch_size": 10,
            "speed_factor": 1.0,
            "seed": 3500,
            "repetition_penalty": 1.35,
            "text_split_method": "cut4",
            "split_bucket": True,
            "return_fragment": False,
            "streaming_mode": False,
            "parallel_infer": True,
            "aux_ref_audio_paths": [],
            "sample_steps": 32,
            "super_sampling": True
        }

        # 构造请求数据
        request_json = {
            "text": text,
            "text_lang": config_this["text_lang"],
            "ref_audio_path": config_this["ref_audio_path"],
            "aux_ref_audio_paths": config_this["aux_ref_audio_paths"],
            "prompt_text": config_this["prompt_text"],
            "prompt_lang": config_this["prompt_lang"],
            "top_k": config_this["top_k"],
            "top_p": config_this["top_p"],
            "temperature": config_this["temperature"],
            "text_split_method": config_this["text_split_method"],
            "batch_size": config_this["batch_size"],
            "batch_threshold": config_this["batch_threshold"],
            "split_bucket": config_this["split_bucket"],
            "return_fragment": config_this["return_fragment"],
            "speed_factor": config_this["speed_factor"],
            "streaming_mode": config_this["streaming_mode"],
            "seed": config_this["seed"],
            "parallel_infer": config_this["parallel_infer"],
            "repetition_penalty": config_this["repetition_penalty"],
            "sample_steps": config_this["sample_steps"],
            "super_sampling": config_this["super_sampling"]
        }

        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(config_this["url"], json=request_json) as resp:
                    if resp.status == 200:
                        content = await resp.read()
                        if output_file:
                            with open(output_file, "wb") as file:
                                file.write(content)
                        else:
                            return content
                    else:
                        text_content = await resp.text()
                        error_msg = f"GPT-SoVITS TTS请求失败: {resp.status} - {text_content}"
                        raise Exception(error_msg)
            except aiohttp.ClientError as e:
                raise Exception(f"GPT-SoVITS TTS请求失败: {str(e)}")

# async def fun(n):
#     tts = GPTSoVITS()
#     audio_data = await tts.text_to_speech("你好，我是数字伙伴")
#     with open(f"{n}.wav", "wb") as f:
#         f.write(audio_data)
#     print("done")
#
# # 只有当此脚本作为主模块运行时才执行测试函数
# if __name__ == "__main__":
#     asyncio.run(fun("微调后"))


