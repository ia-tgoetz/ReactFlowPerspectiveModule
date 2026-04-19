histProvidePath83="./data/config/resources/core/com.inductiveautomation.historian/historian-provider"
STATELIST=["Not Started","Queued (Waiting to start)","Running","Finished (Success)","Error / Timeout"]
import os  # Import the os module for file system operations
import json
import shutil
from com.inductiveautomation.ignition.gateway import IgnitionGateway
from java.util.concurrent import TimeUnit, TimeoutException


def listAllFolders(folder="./data"):
	projectParentFolder = folder #str(context.systemManager.dataDir.absoluteFile).replace('\\','/')
	# Get all items, then filter for only directories
	all_items = os.listdir(projectParentFolder)
	folders_only = [d for d in all_items if os.path.isdir(os.path.join(projectParentFolder, d))]
	return folders_only
	
def listAllFileStructure(folder="./data"):
	folder_structure = []
	for root, dirs, files in os.walk(folder):
		# 'root' is the current folder path
		# 'dirs' is a list of subfolders in that root
		# 'files' is a list of files in that root
		folder_structure.append("Folder: %s contains %d files" % (root, len(files)))
	return folder_structure

def listAllFiles(folder="./data", fileFilter=""):
	projectParentFolder = folder
	all_contents = os.listdir(projectParentFolder)
	
	# Filter for files AND check if they end with the specified string
	files_only = [
		f for f in all_contents 
		if os.path.isfile(os.path.join(projectParentFolder, f)) 
		and f.endswith(fileFilter)
	]
	
	return files_only
	
from com.inductiveautomation.ignition.gateway import IgnitionGateway
from java.util.concurrent import TimeUnit, TimeoutException

STATELIST=["Not Started","Queued (Waiting to start)","Running","Finished (Success)","Error / Timeout"]

def scanFileSystem(scanConfigs=True, scanProjects=True, statusText=False):
	"""
	Forces the Ignition Gateway to scan the file system.
	State Mapping:
	0 = Not Started
	1 = Queued (Waiting to start)
	2 = Running
	3 = Finished (Success)
	4 = Error / Timeout
	"""
	context = IgnitionGateway.get()
	global_dict = system.util.getGlobals()

	status_codes = {"ConfigScan": {"code":0}, "ProjectScan": {"code":0}}
	
	# --- PRE-SCAN SETUP ---
	if scanConfigs:
		existing_config = global_dict.get("ConfigScanTask")
		if not (hasattr(existing_config, 'isDone') and not existing_config.isDone()):
			global_dict["ConfigScanTask"] = "QUEUED"
			
	if scanProjects:
		existing_project = global_dict.get("ProjectScanTask")
		if not (hasattr(existing_project, 'isDone') and not existing_project.isDone()):
			global_dict["ProjectScanTask"] = "QUEUED"

	# --- 1. Handle the Gateway Configuration scan (data/config) ---
	if scanConfigs:
		try:
			if global_dict.get("ConfigScanTask") == "QUEUED":
				config_future = context.getConfigurationManager().requestScan()
				global_dict["ConfigScanTask"] = config_future
			else:
				config_future = global_dict.get("ConfigScanTask")
			# Block the script until the scan finishes
			config_future.get(15, TimeUnit.SECONDS)
			status_codes["ConfigScan"]["code"] = 3  # 3 = Finished
			status_codes["ConfigScan"]["status"] = STATELIST[3]
		except TimeoutException:
			status_codes["ConfigScan"]["code"] = 4  # 4 = Error/Timeout
			status_codes["ConfigScan"]["status"] = STATELIST[4]
		except Exception as e:
			status_codes["ConfigScan"]["code"] = 4  # 4 = Error/Timeout
			status_codes["ConfigScan"]["status"] = STATELIST[4]
			
	# --- 2. Handle the Project Files scan (data/projects) ---
	if scanProjects:
		try:
			if global_dict.get("ProjectScanTask") == "QUEUED":
				project_future = context.getProjectManager().requestScan()
				global_dict["ProjectScanTask"] = project_future
			else:
				project_future = global_dict.get("ProjectScanTask")
			# Block the script until the scan finishes
			project_future.get(15, TimeUnit.SECONDS)
			status_codes["ProjectScan"]["code"] = 3  # 3 = Finished
			status_codes["ProjectScan"]["status"] = STATELIST[3]
		except TimeoutException:
			status_codes["ProjectScan"]["code"] = 4  # 4 = Error/Timeout
			status_codes["ProjectScan"]["status"] = STATELIST[4]
		except Exception as e:
			status_codes["ProjectScan"]["code"] = 4  # 4 = Error/Timeout
			status_codes["ProjectScan"]["status"] = STATELIST[4]

	# --- RETURN LOGIC ---
	return status_codes

def checkScanStatus(scanConfigs=True, scanProjects=True, statusText=False):
	"""
	Retrieves the stored objects from globals for the specified scans.
	State Mapping:
	0 = Not Started
	1 = Queued (Waiting to start)
	2 = Running
	3 = Finished (Success)
	4 = Error / Timeout
	"""
	global_dict = system.util.getGlobals()
	def get_status(task_name, display_name):
		task = global_dict.get(task_name)
		
		# Returns a tuple: (Text String, Integer Code)
		if task is None:
			return display_name + ": Not started yet.", 0
		elif task == "QUEUED":
			return display_name + ": QUEUED (Waiting to start...)", 1
		elif hasattr(task, 'isDone'):
			if not task.isDone():
				return display_name + ": RUNNING...", 2
			elif task.isCompletedExceptionally():
				return display_name + ": ERROR (Finished with exceptions).", 4
			else:
				return display_name + ": FINISHED.", 3
		else:
			return display_name + ": UNKNOWN STATE.", 4
			
	# Lists/Dicts to hold only the requested returns
	texts = []
	ints = {"ConfigScan": {"code":0}, "ProjectScan": {"code":0}}

	# Check Config Scan Status if requested
	if scanConfigs:
		config_text, config_int = get_status("ConfigScanTask", "Config Scan")
		texts.append(config_text)
		ints["ConfigScan"]["code"] = config_int
		ints["ConfigScan"]["status"] = STATELIST[config_int]
		
	# Check Project Scan Status if requested
	if scanProjects:
		project_text, project_int = get_status("ProjectScanTask", "Project Scan")
		texts.append(project_text)
		ints["ProjectScan"]["code"] = project_int
		ints["ProjectScan"]["status"] = STATELIST[project_int]
	# --- RETURN LOGIC ---
	return ints