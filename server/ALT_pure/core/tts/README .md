## 文本转语音(huoshan)
    text_to_audio(self,text:str,filename:str='这里输入保存文件名.wav')  # 用户接口，输入文本，生成音频文件，目前仅支持wav
    async def smart_request_huoshan(self,raw_text): # 智能分割文本，智能并发，返回音频路径列表
## 音频处理+播放器(audio_process)
    play(self, audio_path): 音频播放器
    merge_wav_files(self,audio_paths:List[str],filename:str="output.wav"): 合并音频wav格式,自动管理缓存数量，默认50个