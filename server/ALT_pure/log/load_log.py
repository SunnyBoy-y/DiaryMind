import sys
from loguru import logger
from pathlib import Path
import os

logger.remove()

logger.add(
    sink=sys.stdout,
    colorize=True,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level}</level> | <cyan>[{extra[tag]}]</cyan> | {message}",
    level="INFO",
    enqueue=True,
)


OUT_PATH=Path(os.path.dirname(__file__))
os.makedirs(OUT_PATH, exist_ok=True)
logger.add(
    sink=str(OUT_PATH / "{time:YYYYMMDD}.log"),
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | [{extra[tag]}] | {message}",
    level="WARNING",
    enqueue=True,
    rotation="1 MB",
    retention="7 days",
    encoding="utf-8",
    compression="zip",
)
