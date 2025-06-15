import logging
import os
from logging.handlers import RotatingFileHandler
from google.cloud import logging as cloud_logging
from google.cloud.logging.handlers import CloudLoggingHandler
from server.config import FLASK_ENV, LOG_LEVEL, LOGGER_CREDS

# formatter for all handlers
formatter = logging.Formatter(
	"[%(asctime)s] %(levelname)s in %(module)s: %(message)s"
)

# make console handler
def makeConsoleHandler():
	cHandler = logging.StreamHandler()
	cHandler.setFormatter(formatter)
	return cHandler

# make rotating file handler
def makeFileHandler():
	logDir = os.path.join(os.path.dirname(__file__), "logs")
	os.makedirs(logDir, exist_ok=True)
	fHandler = RotatingFileHandler(
		os.path.join(logDir, "app.log"),
		maxBytes=5 * 1024 * 1024,
		backupCount=3
	)
	fHandler.setFormatter(formatter)
	return fHandler

# make cloud handler
def makeCloudHandler():
	client = cloud_logging.Client().from_service_account_info(LOGGER_CREDS)
	cloudHandler = CloudLoggingHandler(client)
	cloudHandler.setFormatter(formatter)
	return cloudHandler

# collect handlers dependent on flask environment
handlers = [makeCloudHandler()]
if FLASK_ENV == "development":
	handlers.extend([makeConsoleHandler(), makeFileHandler()])

# Define log config for all loggers to inherit
rootLogger = logging.getLogger()
rootLogger.setLevel(LOG_LEVEL)
if not getattr(rootLogger, '_configured', False):
	for handler in handlers:
		rootLogger.addHandler(handler)
	rootLogger._configured = True

# Return name logger based on provided name
def getLogger(name=__name__):
	return logging.getLogger(name)
