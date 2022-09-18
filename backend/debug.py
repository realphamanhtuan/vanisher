from datetime import datetime
import config

log_file = open(config.LOG_PATH + "/log_{}.txt".format(datetime.now().strftime("%s")), "w")

def Now():
    return datetime.now().strftime("%y-%m-%d %H:%M:%S")
def Log(*x):
    print(Now(), "!", *x)
    print(Now(), "!", *x, file=log_file)

def Verbose(*x):
    print(Now(), *x)
    print(Now(), "!", *x, file=log_file)