import os
import yaml
from pathlib import Path
from ALT_pure.log.load_log import logger

TAG=__name__
CONFIG_PATH=Path(os.path.join(os.path.dirname(__file__),"config.yaml"))
try:
    with open(CONFIG_PATH,'r',encoding="utf-8") as f:
        config=yaml.safe_load(f)

    if config is None:
        logger.bind(tag=TAG).warning("config文件为空")
        config = {}
except FileNotFoundError:
    logger.bind(tag=TAG).warning("未找到config文件")
    config = {}
# except yaml.YAMLError:
#     logger.bind(tag=TAG).warning("config文件格式错误")
#     config = {}
except Exception as e:
    logger.bind(tag=TAG).warning(f"config加载时未知错误:{e}")
    config = {}