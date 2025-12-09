from ALT_pure.log.load_log import logger
from ALT_pure.config.load_config import config
import re
import emoji
TAG=__name__

class TextProcessor:
    def __init__(self):
        self.logger = logger.bind(tag=TAG)
        self.max_split_len=config.get("text_processor",{"max_split_len":50}).get("max_split_len",50)

    @staticmethod
    def text_clean(text: str) -> str:
        # 用户接口
        # 文本清洗，过滤表情包、网址等
        text = emoji.replace_emoji(text, replace='')
        text = re.sub(r'(\*{1,2}|_)(.+?)(\*{1,2}|_)', r'\2', text)
        text = re.sub(r'!\[.*?]\(.*?\)', '', text)
        text = re.sub(r'\$\$(.+?)\$\$(?:\$\$.*?\$\$)?', r'\1', text)
        text = re.sub(r'^#{1,6}\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'^[*-]\s+', '', text, flags=re.MULTILINE)
        text = re.sub(r'https?://\S+', '', text)
        return text

    @staticmethod
    def text_cutter_by_language(text: str, language: str = 'auto') -> list:
        # 用户接口
        # 按照标点，多语言文本切割
        # 注意，暂不支持超长文本切断，如果需要请调用函数self._split_long_text
        if text is None or text == "":
            return []
        mixed_mode = False
        if language == 'auto':
            has_chinese = re.search(r'[\u4e00-\u9fff]', text)
            has_latin = re.search(r'[a-zA-Z]', text)
            if has_chinese and has_latin:
                mixed_mode = True
            elif has_chinese:
                language = 'zh'
            elif re.search(r'[À-ÿ]', text):  # 法语字符
                language = 'fr'
            elif re.search(r'[ÄÖÜäöüß]', text):  # 德语字符
                language = 'de'
            elif re.search(r'[ぁ-ゔァ-ヴー]', text):  # 日语假名
                language = 'ja'
            else:
                language = 'en'
        if mixed_mode or (language == 'zh' and re.search(r'[a-zA-Z]', text)):
            pattern = (
                r'(?<=[。！？；…])|'  # 中文标点
                r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?|\!)\s+|'  
                r'(?<=\.")\s+|(?<=\?")\s+|(?<=\!")|' 
                r'(?<=[.!?])(?=[\u4e00-\u9fff])|'  
                r'(?<=[。！？；…])(?=[a-zA-Z])'
            )
            sentences = re.split(pattern, text)
            sentences = [s.strip() for s in sentences if s.strip()]
            result = []
            for sentence in sentences:
                if re.search(r'[.!?]', sentence) and re.search(r'[。！？；…]', sentence):
                    sub_pattern = (
                        r'(?<=[.!?])|'  
                        r'(?<=[。！？；…])'
                    )
                    sub_sentences = re.split(sub_pattern, sentence)
                    sub_sentences = [s.strip() for s in sub_sentences if s.strip()]
                    merged_sentences = []
                    i = 0
                    while i < len(sub_sentences):
                        if i + 1 < len(sub_sentences) and len(sub_sentences[i + 1]) == 1 and sub_sentences[
                            i + 1] in '。！？；….!?':
                            merged_sentences.append(sub_sentences[i] + sub_sentences[i + 1])
                            i += 2
                        else:
                            merged_sentences.append(sub_sentences[i])
                            i += 1

                    result.extend(merged_sentences)
                else:
                    result.append(sentence)

            result = [s for s in result if s]
            return result

        if language == 'zh':

            sentences = re.split(r'([。！？；…]+)', text)
            sentences = [s.strip() for s in sentences if s.strip()]
            result = []
            for i in range(0, len(sentences), 2):
                if i + 1 < len(sentences):
                    result.append(sentences[i] + sentences[i + 1])
                else:
                    result.append(sentences[i])
            return result

        elif language == 'ja':
            sentences = re.split(r'([。！？]+)', text)
            sentences = [s.strip() for s in sentences if s.strip()]
            result = []
            for i in range(0, len(sentences), 2):
                if i + 1 < len(sentences):
                    result.append(sentences[i] + sentences[i + 1])
                else:
                    result.append(sentences[i])
            return result

        elif language in ('en', 'fr', 'de'):
            abbreviations = r'(?<!Mr)(?<!Mrs)(?<!Dr)(?<!Prof)(?<!Rev)(?<!Hon)\.'
            pattern = rf'(?<=[.!?]) +|{abbreviations} +'
            sentences = re.split(pattern, text)
            return [s.strip() for s in sentences if s.strip()]

        else:
            sentences = re.split(r'(?<=[.!?]) +', text)
            return [s.strip() for s in sentences if s.strip()]

    def text_merger(self,texts: list=None):
        # 用户接口，合并短文本，避免单个长文本,返回足够长的文本段
        if texts is [] or len(texts) == 0 or texts is None:
            return []

        buffer=[]
        for text in texts:
            if len(text) >self.max_split_len:
                buffer.extend(self._split_long_text(text))
            else:
                buffer.append(text)

        result=[]
        temp=""

        for text in buffer:
            if not text.strip():
                continue

            if len(temp)+len(text)<=self.max_split_len:
                temp+=text
            else:
                if temp:
                    result.append(temp)
                if len(text)<=self.max_split_len:
                    temp=text
                else:
                    result.extend(self._split_long_text(text))
                    temp=""

        if temp:
                result.append(temp)

        return result

    def _split_long_text(self,text:str):
        # 分割过长文本，尽量标点，不行就割断
        result=[]
        if text is None or text.strip()=="":
            return []
        while len(text)>self.max_split_len:
            search_range=text[:self.max_split_len+1]
            matches=list(re.finditer(r'[，。！？；,…!?;]',search_range))
            if matches:
                split_pos=matches[-1].end()
            else:
                split_pos=self.max_split_len
            result.append(text[:split_pos])
            text=text[split_pos:]
        if text:
            result.append(text)

        return result


