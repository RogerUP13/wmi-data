﻿rowHeight = 14
widthBar = 80

var CpuData = {}
var RamData = {}
var HddData = {}
var NetData = {}

function Start()
{
	//debugger;

	CreateObjects();
	CalculateHeight();

	Paint();
	NetLib = GetLibrary();
	//NetLib2 = new ActiveXObject("WMI.GetData");
	NetLib.Start();

	setTimeout(function() {setInterval(Update, 1000)}, 5000);
	//setInterval(UpdateWithoutWMI, 1000);
	//setInterval(DisplayData, 1000);
}

function Stop()
{
	NetLib.Stop();
	UnregisterLibrary();
}

function AvailDrivesCount()
{
	validLetters = 0;
	letters = 'ABCDEFJGHGKLMNOPQRSTUVWXYZ';

	for (i = 0; i < letters.length; i++)
		try
		{
			if (System.Shell.drive(letters.charAt(i)).isReady)
			{
				validLetters++;
			}
		}
		catch (e)
		{
		}

	return validLetters;
}

function Update()
{	
	for (i = 0; i < NetLib.GetCoresCount() ; i++)
	{
		temp = NetLib.GetProcessorData(i);

		if (temp.name != "_Total")
			CpuData['Core' + i] = parseInt(temp.usePercent)
		else
			CpuData.AllCores = parseInt(temp.usePercent);
	}

	RamData.Free = System.Machine.availableMemory;
	RamData.UseRam = RamData.Total - RamData.Free;
	RamData.PercentUseRam = (100 * RamData.UseRam / RamData.Total).toFixed();

	drivesCount = NetLib.GetDrivesCount();
	if (HddData.Count > drivesCount)
	{
		hddDiv.innerHTML = '';
		for (i = 0; i < HddData.Count; i++)
		{
			delete HddData['Drive' + i];
		}
		HddData.Count = 0;

		HddData.Count = drivesCount;
		for (i = 0; i < HddData.Count; i++)
		{
			HddData['Drive' + i] = {
				Name: 'null:',
				VolumeName: 'null',
				FreeSpace: '0 байт',
				ActivePercent: 0,
				UsePercent: 0
			}
			PaintHdd(i);
		}
	}

	if (HddData.Count < drivesCount)
	{
		PaintHdd(HddData.Count);
		HddData['Drive' + HddData.Count] = {
			Name: 'null:',
			VolumeName: 'null',
			FreeSpace: '0 байт',
			ActivePercent: 0,
			UsePercent: 0
		}
		HddData.Count++;
	}

	for (i = 0; i < drivesCount ; i++)
	{
		temp = NetLib.GetDriveData(i);

		HddData['Drive' + i].Name = temp.name;
		HddData['Drive' + i].FreeSpace = formatBytes(temp.freeSpace, 'b');
		HddData['Drive' + i].VolumeName = temp.volumeName;
		HddData['Drive' + i].UsePercent = temp.usePercent;
		HddData['Drive' + i].ActivePercent = temp.activePercent;
	}

	temp = NetLib.GetNetworkData();
	NetData.Received = formatBytes(temp.received, 'b');
	NetData.Sent = formatBytes(temp.sent, 'b');
	
	DisplayData();
}

function UpdateWithoutWMI()
{
	CpuData.CountCores = System.Machine.CPUs.count;
	tempAllCores = 0;
	for (i = 0; i < CpuData.CountCores; i++)
	{
		tempPercent = Math.min(Math.max(System.Machine.CPUs.item(i).usagePercentage, 0), 100);
		CpuData['Core' + i] = parseInt(tempPercent);
		tempAllCores += parseInt(tempPercent);
	}
	CpuData.AllCores = Math.round(tempAllCores/CpuData.CountCores);
	
	RamData.Free = System.Machine.availableMemory;
	RamData.UseRam = RamData.Total - RamData.Free;
	RamData.PercentUseRam = Math.round(100 * RamData.UseRam / RamData.Total);
	
	DisplayData();
}

function DisplayData()
{
	cpu();
	ram();
	hdd();
	network();
	CalculateHeight();
}

function cpu()
{
	document.getElementById('totalPercent').innerHTML = CpuData.AllCores + ' %';
	for (i = 0; i < CpuData.CountCores; i++)
	{
		document.getElementById('Core' + i).innerHTML = CpuData['Core' + i] + ' %';
		document.getElementById('Core' + i + 'Width').style.width = CalcWidthBar(CpuData['Core' + i]);
	}
}

function ram()
{
	document.getElementById('useRam').innerHTML = formatBytes(RamData.UseRam, 'mb');
	document.getElementById('percentUseRam').innerHTML = RamData.PercentUseRam + ' %';
	document.getElementById('percentUseRamWidth').style.width = CalcWidthBar(RamData.PercentUseRam);
}

function hdd()
{
	for (i = 0; i < HddData.Count; i++)
	{
		document.getElementById('Drive' + i + 'Header').onclick = OpenDrive;
		document.getElementById('Drive' + i + 'Name').innerHTML = HddData['Drive' + i].Name + ' ' + HddData['Drive' + i].VolumeName;
		document.getElementById('Drive' + i + 'FreeSpace').innerHTML = HddData['Drive' + i].FreeSpace;
		document.getElementById('Drive' + i + 'UsePerc').innerHTML = HddData['Drive' + i].UsePercent + ' %';
		document.getElementById('Drive' + i + 'UsePercWidth').style.width = CalcWidthBar(HddData['Drive' + i].UsePercent);
		document.getElementById('Drive' + i + 'ActivePercent').innerHTML = HddData['Drive' + i].ActivePercent + ' %';
		document.getElementById('Drive' + i + 'ActivePercentWidth').style.width = CalcWidthBar(HddData['Drive' + i].ActivePercent);
	}
}

function network()
{
	document.getElementById('NetReceived').innerHTML = NetData.Received;
	document.getElementById('NetSent').innerHTML = NetData.Sent;
}

function formatBytes(bytes, size)
{
	if (size == "b")
	{
		if (bytes > 1073741824) return (bytes / 1073741824).toFixed(2) + ' Гб';
		if (bytes > 1048576) return (bytes / 1048576).toFixed(2) + ' Мб';
		if (bytes > 1024) return (bytes / 1024).toFixed(2) + ' Кб';
		return bytes + ' байт';
	}
	if (size == 'kb')
	{
		if (bytes > 1048576) return (bytes / 1048576).toFixed(2) + ' Гб';
		if (bytes > 1024) return (bytes / 1024).toFixed(2) + ' Мб';
		return bytes + ' Кб';
	}
	if (size == 'mb')
	{
		if (bytes > 1024) return (bytes / 1024).toFixed(2) + ' Гб';
		return bytes + ' Мб';
	}
}

function CalculateHeight()
{
	cpuSect.style.height = 18 + CpuData.CountCores * rowHeight;
	ramSect.style.height = 18 + 1 * rowHeight;
	hddSect.style.height = 3 + HddData.Count * rowHeight * 3 + 3 * (HddData.Count - 1);
	networkSect.style.height = 18 + 1 * rowHeight;
	document.body.style.height = parseInt(cpuSect.style.height) + parseInt(ramSect.style.height) + parseInt(hddSect.style.height) + parseInt(networkSect.style.height) + 3;
	bottom.style.top = parseInt(document.body.style.height) - 10;
	midle.style.height = parseInt(document.body.style.height) - 20;
}

function CalcWidthBar(percent)
{
	return Math.round(percent * widthBar / 100);
}

function OpenDrive()
{
	System.Shell.execute(this.outerText.slice(0,2));
}

function Paint()
{
	totalPercent.innerHTML = 0 + ' %';
	for (i = 0; i < CpuData.CountCores; i++)
	{
		cpuDiv.innerHTML +=
			'<div id="Core' + i + '" style="top:' + (i * rowHeight) + 'px; left:3px; width:30px">0 %</div>' +
			'<div style="top:' + (i * rowHeight) + 'px; width:' + widthBar + 'px; margin: 2px 0 0 35px;">' +
				'<img src="image/bars/back1.png" style="width:' + widthBar + 'px; height:8px; border: 1px solid #111111;"/>' +
				'<img id="Core' + i + 'Width" src="image/bars/cpu1.png" style="width:0px; height:8px; top:1px; left:1px;"/>' +
			'</div>';
	}

	useRam.innerHTML = '0 Мб';
	ramDiv.innerHTML =
		'<div id="percentUseRam" style="top:' + (0 * rowHeight) + 'px; left:3px; width:30px">0 %</div>' +
		'<div style="top:' + (0 * rowHeight) + 'px; width:' + widthBar + 'px; margin: 2px 0 0 35px;">' +
			'<img src="image/bars/back1.png" style="width:' + widthBar + 'px; height:8px; border: 1px solid #111111;"/>' +
			'<img id="percentUseRamWidth" src="image/bars/ram1.png" style="width:0px; height:8px; top:1px; left:1px;"/>' +
		'</div>';

	for (i = 0; i < HddData.Count; i++)
	{
		PaintHdd(i);
	}

	networkDiv.innerHTML =
		'<div style="top:' + (0 * rowHeight) + 'px; left:3px;">' +
			'<img src="image/down.png">' +
			'<div id="NetReceived" style="left:13px; width:45px"></div>' +
		'</div>' +
		'<div style="top:' + (0 * rowHeight) + 'px; left:60px;">' +
			'<img src="image/up.png">' +
			'<div id="NetSent" style="left:13px; width:45px"></div>' +
		'</div>';
}

function PaintHdd(i)
{
	hddDiv.innerHTML +=
		'<img style="top:' + ((i * 3 + 0) * rowHeight + 3 * (i - 1)) + 'px; left:-1px;" class="divider" src="image/horizontalDivider.png" alt=""/>' +
		'<div id="Drive' + i + 'Header" style="top:' + (3 * i * (rowHeight + 1)) + 'px; left:0px; width:120px; height:' + (3 * rowHeight) + 'px; ">' +
		'<div id="Drive' + i + 'Name" style="top:' + 0 * rowHeight + 'px; left:3px; text-overflow: ellipsis;"></div>' +
		'<div id="Drive' + i + 'FreeSpace" style="top:' + 0 * rowHeight + 'px; right:4px;">0</div>' +
		'<div id="Drive' + i + 'UsePerc" style="top:' + 1 * rowHeight + 'px; left:3px; width:30px">0 %</div>' +
		'<div style="top:' + 1 * rowHeight + 'px; width:' + widthBar + 'px; margin: 2px 0 0 35px;">' +
			'<img src="image/bars/back1.png" style="width:' + widthBar + 'px; height:8px; border: 1px solid #111111;"/>' +
			'<img id="Drive' + i + 'UsePercWidth" src="image/bars/hdd1.png" style="width:0px; height:8px; top:1px; left:1px;"/>' +
		'</div>' +
		'<div id="Drive' + i + 'ActivePercent" style="top:' + 2 * rowHeight + 'px; left:3px; width:30px">0 %</div>' +
		'<div style="top:' + 2 * rowHeight + 'px; width:' + widthBar + 'px; margin: 2px 0 0 35px;">' +
			'<img src="image/bars/back1.png" style="width:' + widthBar + 'px; height:8px; border: 1px solid #111111;"/>' +
			'<img id="Drive' + i + 'ActivePercentWidth" src="image/bars/hdd2.png" style="width:0px; height:8px; top:1px; left:1px;"/>' +
		'</div>' +
		'</div>';
}

function CreateObjects()
{
	CpuData.CountCores = System.Machine.CPUs.count;
	CpuData.AllCores = 0;
	for (i = 0; i < CpuData.CountCores; i++)
	{
		CpuData['Core' + i] = 0;
	}

	RamData.Free = 0;
	RamData.Total = System.Machine.totalMemory;
	RamData.UseRam = 0;
	RamData.PercentUseRam = 0;

	HddData.Count = AvailDrivesCount();
	for (i = 0; i < HddData.Count; i++)
	{
		HddData['Drive' + i] = {
			Name: 'null:',
			VolumeName: 'null',
			FreeSpace: '0 байт',
			ActivePercent: 0,
			UsePercent: 0
		}
	}

	NetData.Received = '0 байт';
	NetData.Sent = '0 байт';
}