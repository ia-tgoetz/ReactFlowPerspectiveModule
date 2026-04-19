tagProviderDir="./data/config/resources/core/ignition/tag-provider"
histProvidePath83="./data/config/resources/core/com.inductiveautomation.historian/historian-provider"
STATELIST=["Not Started","Queued (Waiting to start)","Running","Finished (Success)","Error / Timeout"]
import json
import os


def listAllFolders(folder="./data"):
	projectParentFolder = folder #str(context.systemManager.dataDir.absoluteFile).replace('\\','/')
	# Get all items, then filter for only directories
	all_items = os.listdir(projectParentFolder)
	folders_only = [d for d in all_items if os.path.isdir(os.path.join(projectParentFolder, d))]
	return folders_only

def writeJsonFile(jsonDict, filename, directory):
	# 1. Define your data (typically a dictionary)
	data = jsonDict
	# 2. Convert dictionary to a JSON string
	# indent=4 makes the file human-readable
	json_string = json.dumps(data, indent=4)
	# 3. Define your file path
	# Note: Use forward slashes or double backslashes for Windows paths
	path = "{}/{}".format(directory,filename)
	# 4. Write the file
	# The third argument 'False' means it will NOT append; it will overwrite.
	system.file.writeFile(path, json_string, False)

def checkDirAndCreate(directory):
	try:
		if not os.path.exists(directory):
			os.makedirs(directory)
		return True
	except:
		return False

def scanFileSystem(scanConfigs=True, scanProjects=True, returnSuccess=True):
	from com.inductiveautomation.ignition.gateway import IgnitionGateway
	from java.util.concurrent import TimeUnit, TimeoutException
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
	successful=False
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
			successful=True
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
			successful=True
		except TimeoutException:
			status_codes["ProjectScan"]["code"] = 4  # 4 = Error/Timeout
			status_codes["ProjectScan"]["status"] = STATELIST[4]
		except Exception as e:
			status_codes["ProjectScan"]["code"] = 4  # 4 = Error/Timeout
			status_codes["ProjectScan"]["status"] = STATELIST[4]

	# --- RETURN LOGIC ---
	if returnSuccess:
		return successful
	return status_codes
	
def createProvider(providerName):
	from java.util import UUID
	new_uuid = UUID.randomUUID()
	uuid_string = str(new_uuid)
	resourceJson={
	  "scope": "A",
	  "description": "",
	  "version": 1,
	  "restricted": False,
	  "overridable": True,
	  "files": [
	    "config.json"
	  ],
	  "attributes": {
	    "uuid": uuid_string,
	    "enabled": True
	  }
	}
	configJson={
	  "profile": {
	    "allowBackfill": False,
	    "enableTagReferenceStore": True,
	    "type": "STANDARD"
	  },
	  "settings": {
	    "defaultDatasourceName": None,
	    "editPermissions": {
	      "securityLevels": [],
	      "type": "AllOf"
	    },
	    "readOnly": False,
	    "readPermissions": {
	      "securityLevels": [],
	      "type": "AllOf"
	    },
	    "valuePersistence": "Database",
	    "writePermissions": {
	      "securityLevels": [],
	      "type": "AllOf"
	    }
	  }
	}
	directory='{}/{}'.format(tagProviderDir,providerName)
	if providerName not in listAllFolders(folder=tagProviderDir):
		if checkDirAndCreate(directory):
			writeJsonFile(configJson, "config.json", directory)
			writeJsonFile(resourceJson, "resource.json", directory)
			if scanFileSystem(scanConfigs=True, scanProjects=True, returnSuccess=True):
				return "Config Scan Complete, Refresh Providers in Designer or check Realtime Tag Providers on Gateway"
			else:
				return "Config Scan Failed"
		else:
			return "Provider Folder Not Created or Does Not Exist"
	else:		
		return "Provider Already Exists"
		
def getHistoryProviderType(provider):
	path="{}/{}/config.json".format(histProvidePath83,provider)
	return str(json.loads(system.file.readFileAsString(path))['profile']['type']).replace("Historian","").upper()


def get83HistoryProviderStatus(provider):
	path="{}/{}/resource.json".format(histProvidePath83,provider)
	return json.loads(system.file.readFileAsString(path))
	
def get83HistoryProviders(enabled=True, asDict=True, isCore=True, isSQL=True, addEmpty=True):
	providersData=listAllFolders(folder=histProvidePath83)
	providers=[]
	if asDict:
		if addEmpty: providers.append({"label": "", "value": "", "isDisabled": False})
		for provider in providersData:
			provEnabled=get83HistoryProviderStatus(provider)['attributes']['enabled']
			providerType=str(getHistoryProviderType(provider))
			if (isCore and providerType=="CORE") or (isSQL and providerType=="SQL"):
				label='{} ({})'.format(provider,providerType)
				isDisabled=False
				if not provEnabled:
					label="{} (DISABLED)".format(provider)
					isDisabled=True
				providers.append({"label": label, "value":provider, "isDisabled":isDisabled})
		sortedProviders = sorted(list(providers), key=lambda item: (
			0 if item.get("value") == "" else 1,		 # Priority 1: Blanks go to the top (0)
			1 if item.get("isDisabled", False) else 0,   # Priority 2: Disabled go to the bottom (1)
			str(item.get("label", "")).lower()		   # Priority 3: Alphabetize the rest
		))
		providers=sortedProviders
	else:
		if addEmpty: providers.append("")
		if enabled:
			for provider in providersData:
				if exchange.historyMigration.FileSystem.get83HistoryProviderStatus(provider)['attributes']['enabled']:
					providers.append(provider)
		else: 
			for provider in providersData:
				providers.append(provider)
	return providers