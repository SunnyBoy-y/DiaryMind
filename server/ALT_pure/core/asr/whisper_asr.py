from faster_whisper import WhisperModel
import os


def audio_to_text(audio_path, model_size="medium", language=None, device="cpu"):
    """
    将本地音频文件转为文本（支持中英文）

    参数：
    - audio_path: 音频文件路径（支持 mp3, wav, m4a 等常见格式）
    - model_size: 模型大小，可选: 'tiny', 'base', 'small', 'medium', 'large-v2', 'large-v3'
    - language: 语言代码，如 'zh' 中文, 'en' 英文，设为 None 可自动检测
    - device: 运行设备，'cuda'（GPU）、'cpu'，'auto' 自动选择

    返回：
    - 识别出的文本字符串
    """

    # 检查音频文件是否存在
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"音频文件未找到: {audio_path}")

    # 加载模型（首次运行会自动下载模型到缓存目录）
    print(f"正在加载模型 '{model_size}'...")

    # 处理 CUDA/cuDNN 问题，如果 GPU 不可用则回退到 CPU
    try:
        if device == "auto":
            # 检查 CUDA 是否可用
            import torch
            if torch.cuda.is_available():
                device = "cuda"
                compute_type = "float16"
            else:
                device = "cpu"
                compute_type = "int8"
        elif device == "cuda":
            compute_type = "float16"
        else:
            compute_type = "int8"

        model = WhisperModel(model_size, device=device, compute_type=compute_type)
        print(f"使用设备: {device}")
    except Exception as e:
        print(f"GPU 加速不可用，回退到 CPU: {e}")
        model = WhisperModel(model_size, device="cpu", compute_type="int8")
        print("使用设备: cpu")

    print(f"开始识别音频: {audio_path}")
    segments, info = model.transcribe(
        audio_path,
        language=language,  # 可设为 'zh', 'en'，或 None 自动检测
        beam_size=5,  # 束搜索大小，提高精度
        best_of=5,
        temperature=0.0,  # 固定温度提升稳定性
        vad_filter=True,  # 启用静音过滤，提升长音频效率
        vad_parameters=dict(min_silence_duration_ms=500)
    )

    # 输出检测到的语言
    detected_lang = info.language
    print(f"检测到的语言: {detected_lang} (置信度: {info.language_probability:.2f})")

    # 拼接所有文本段
    text = "".join(segment.text for segment in segments)
    return text.strip()


# ================== 使用示例 ==================
if __name__ == "__main__":
    audio_file = r"C:\Users\13600\Desktop\ALT_pure\core\asr\temp\record_audio_16e7d605fc7749328084981bf2fb2bd9.wav"  # ✅ 替换为你的音频路径

    try:
        result = audio_to_text(
            audio_path=audio_file,
            model_size="medium",  # 使用 medium 模型以减少资源消耗
            language=None,  # 自动检测语言（适合中英混合）
            device="gpu"  # 明确指定使用 CPU
        )
        print("\n📝 识别结果：")
        print(result)
    except Exception as e:
        print(f"❌ 错误: {e}")
