﻿"use strict";

System.Gadget.settingsUI = "settings.html"
System.Gadget.onSettingsClosed = SettingsClosed;

var rowHeight = 14;
var widthBar = 80;

var dataElements = [];
var wmi;
var timerId;

var NetworkAdapterName = "";

function CpuObj() {
	var cores = [];
	var allCores = 0;
	this.CoresCount = function () {
		return cores.length;
	}

	for (var i = 0; i < System.Machine.CPUs.count; i++) {
		cores[i] = 0;
		cpuDiv.innerHTML +=
			'<div id="Core' + i + '" style="top:' + (i * rowHeight) + 'px; left:3px; width:30px">0 %</div>' +
			'<div style="top:' + (i * rowHeight) + 'px; width:' + widthBar + 'px; margin: 2px 0 0 35px;">' +
				'<img src="Images/Bars/back1.png" style="width:' + widthBar + 'px" class="barBackground"/>' +
				'<img id="Core' + i + 'Width" src="Images/Bars/cpu1.png" class="barActivity"/>' +
			'</div>';
	}
	totalPercent.innerHTML = 0 + ' %';

	this.Update = function () {
		var j = 0;
		var newCpuData = wmi.NetLib.GetCpuData();
		for (var i = 0; i < newCpuData.length; i++) {
			var core = newCpuData[i];
			if (core.Name != "_Total") {
				cores[j] = parseInt(core.usePercent);
				j++;
			}
			else {
				allCores = parseInt(core.usePercent);
			}
		}
	}

	this.Draw = function () {
		document.getElementById('totalPercent').innerHTML = allCores + ' %';
		for (var i = 0; i < this.CoresCount() ; i++) {
			document.getElementById('Core' + i).innerHTML = cores[i] + ' %';
			document.getElementById('Core' + i + 'Width').style.width = CalcWidthBar(cores[i]);
		}
	}
}

function RamObj() {
	var free = 0;
	var total = 0;
	var use = 0;
	var percentUse = 0;
	var pagingFileUsagePercent = 0;

	freeRam.innerHTML = '0 Мб';
	ramDiv.innerHTML =
		'<div id="percentUseRam" style="top:' + (0 * rowHeight) + 'px; left:3px; width:30px">0 %</div>' +
		'<div style="top:' + (0 * rowHeight) + 'px; width:' + widthBar + 'px; margin: 2px 0 0 35px;">' +
			'<img src="Images/Bars/back1.png" style="width:' + widthBar + 'px" class="barBackground"/>' +
			'<img id="percentUseRamWidth" src="Images/Bars/ram1.png" class="barActivity"/>' +
		'</div>' + 
		'<div id="pagingFileUsagePercentCaption" style="top:' + (1 * rowHeight) + 'px; left:3px; width:30px">0 %</div>' +
		'<div style="top:' + (1 * rowHeight) + 'px; width:' + widthBar + 'px; margin: 2px 0 0 35px;">' +
			'<img src="Images/Bars/back1.png" style="width:' + widthBar + 'px" class="barBackground"/>' +
			'<img id="pagingFileUsagePercentWidth" src="Images/Bars/ram1.png" class="barActivity"/>' +
		'</div>';

	this.Update = function () {
		if (wmi.NetLib.HasRamData()) {
			var ramInfo = wmi.NetLib.GetRamData();
			total = formatBytes(ramInfo.Total, 'kb');
			free = formatBytes(ramInfo.Free, 'kb');
			use = formatBytes(ramInfo.InUse, 'kb');
			percentUse = (100 * ramInfo.InUse / ramInfo.Total).toFixed();
		}
		if (wmi.NetLib.HasPagingFileData()) {
			var pagingFileInfo = wmi.NetLib.GetPagingFileData();
			pagingFileUsagePercent = pagingFileInfo.UsagePercent;
		}
	}

	this.Draw = function () {
		freeRam.innerHTML = free;
		percentUseRam.innerHTML = percentUse + ' %';
		percentUseRamWidth.style.width = CalcWidthBar(percentUse);
		ramSect.title =
			'Всего памяти: ' + total + '\r\n' +
			'Занято памяти: ' + use + '\r\n' +
			'Свободно памяти: ' + free;

		pagingFileUsagePercentCaption.innerHTML = pagingFileUsagePercent + ' %';
		pagingFileUsagePercentWidth.style.width = CalcWidthBar(pagingFileUsagePercent);
	}
}

function DriveObj() {
	var drives = [];
	this.DrivesCount = function () {
		return drives.length;
	}

	var Drive = function () {
		this.Name = 'null:';
		this.VolumeName = 'null';
		this.FreeSpace = '0 байт';
		this.UseSpace = '0 байт';
		this.Space = '0 байт';
		this.ActivePercent = 0;
		this.UsePercent = 0;
	}

	var PaintDrive = function (i) {
		hddDiv.innerHTML +=
			'<img style="top:' + ((i * 3 + 0) * rowHeight + 3 * (i - 1)) + 'px; left:-1px;" class="divider" src="Images/horizontalDivider.png" alt=""/>' +
			'<div id="Drive' + i + '" style="top:' + (3 * i * (rowHeight + 1)) + 'px; left:0px; width:120px; height:' + (3 * rowHeight) + 'px; ">' +
				'<div id="Drive' + i + 'Name" style="top:' + 0 * rowHeight + 'px; left:3px; text-overflow: ellipsis; overflow: hidden; width: 65px;">null</div>' +
				'<div id="Drive' + i + 'FreeSpace" style="top:' + 0 * rowHeight + 'px; right:4px;">0</div>' +
				'<div id="Drive' + i + 'UsePerc" style="top:' + 1 * rowHeight + 'px; left:3px; width:30px">0 %</div>' +
				'<div style="top:' + 1 * rowHeight + 'px; width:' + widthBar + 'px; margin: 2px 0 0 35px;">' +
					'<img src="Images/Bars/back1.png" style="width:' + widthBar + 'px" class="barBackground"/>' +
					'<img id="Drive' + i + 'UsePercWidth" src="Images/Bars/hdd1.png" class="barActivity"/>' +
				'</div>' +
				'<div id="Drive' + i + 'ActivePercent" style="top:' + 2 * rowHeight + 'px; left:3px; width:30px">0 %</div>' +
				'<div style="top:' + 2 * rowHeight + 'px; width:' + widthBar + 'px; margin: 2px 0 0 35px;">' +
					'<img src="Images/Bars/back1.png" style="width:' + widthBar + 'px" class="barBackground"/>' +
					'<img id="Drive' + i + 'ActivePercentWidth" src="Images/Bars/hdd2.png" class="barActivity"/>' +
				'</div>' +
			'</div>';
	}

	var WipeDrive = function (i) {
		var element = document.getElementById("Drive" + i);
		var delimiter = element.previousSibling;
		var parent = element.parentNode;
		parent.removeChild(element);
		parent.removeChild(delimiter);
	}

	var AvailDrivesCount = function () {
		var validLetters = 0;
		var letters = 'ABCDEFJGHGKLMNOPQRSTUVWXYZ';

		for (var i = 0; i < letters.length; i++)
			try {
				if (System.Shell.drive(letters.charAt(i)).isReady) {
					validLetters++;
				}
			}
			catch (e) {
			}

		return validLetters;
	}

	for (i = 0; i < AvailDrivesCount() ; i++) {
		drives[i] = new Drive();
		PaintDrive(i);
	}

	var pathAttributeName = 'data-path';

	var OpenDrive = function() {
		var path = this.getAttribute(pathAttributeName);
		if (path == null)
			return;
		System.Shell.execute(path);
	}

	this.Update = function () {
		var newDrivesData = wmi.NetLib.GetDriveData();

		var drivesCount = newDrivesData.length;
		if (this.DrivesCount() > drivesCount) {
			for (var i = this.DrivesCount() - 1; i >= drivesCount; i--) {
				drives.pop();
				WipeDrive(i);
			}
		}
		else if (this.DrivesCount() < drivesCount) {
			for (var i = this.DrivesCount() ; i < drivesCount; i++) {
				drives[i] = new Drive();
				PaintDrive(i);
			}
		}

		for (var i = 0; i < this.DrivesCount() ; i++) {
			var temp = newDrivesData[i];

			drives[i].Name = temp.name;
			drives[i].FreeSpace = formatBytes(temp.freeSpace, 'b');
			drives[i].Space = formatBytes(temp.space, 'b');
			drives[i].UseSpace = formatBytes(temp.space - temp.freeSpace, 'b');
			drives[i].VolumeName = temp.volumeName;
			drives[i].UsePercent = temp.usePercent;
			drives[i].ActivePercent = temp.activePercent;
			drives[i].DrileLetter = temp.driveLetter;
		}
	}

	this.Draw = function () {
		for (i = 0; i < this.DrivesCount() ; i++) {
			var drive = document.getElementById('Drive' + i);
			var driveName = drives[i].VolumeName + ' (' + drives[i].DrileLetter + ')';
			drive.setAttribute(pathAttributeName, drives[i].Name);
			drive.onclick = OpenDrive;
			drive.title = driveName + '\r\n' +
				'Всего места: ' + drives[i].Space + '\r\n' +
				'Занято места: ' + drives[i].UseSpace + '\r\n' +
				'Свободно места: ' + drives[i].FreeSpace;

			var nameDiv = document.getElementById('Drive' + i + 'Name');
			var spaceDiv = document.getElementById('Drive' + i + 'FreeSpace');

			nameDiv.innerHTML = driveName;
			spaceDiv.innerHTML = drives[i].FreeSpace;
			nameDiv.style.width = 120 - 12 - spaceDiv.offsetWidth + 'px';
			document.getElementById('Drive' + i + 'UsePerc').innerHTML = drives[i].UsePercent + ' %';
			document.getElementById('Drive' + i + 'UsePercWidth').style.width = CalcWidthBar(drives[i].UsePercent);
			document.getElementById('Drive' + i + 'ActivePercent').innerHTML = drives[i].ActivePercent + ' %';
			document.getElementById('Drive' + i + 'ActivePercentWidth').style.width = CalcWidthBar(drives[i].ActivePercent);
		}
	}
}

function NetObj() {
	var received = '0 байт';
	var sent = '0 байт';

	networkDiv.innerHTML =
		'<div style="top:' + (0 * rowHeight) + 'px; left:3px;">' +
			'<img src="Images/down.png">' +
			'<div id="NetReceived" style="left:13px; width:45px; text-overflow: ellipsis; overflow: hidden;">0 байт</div>' +
		'</div>' +
		'<div style="top:' + (0 * rowHeight) + 'px; left:60px;">' +
			'<img src="Images/up.png">' +
			'<div id="NetSent" style="left:13px; width:45px; text-overflow: ellipsis; overflow: hidden;">0 байт</div>' +
		'</div>';

	this.Update = function () {
		var newNetworkData = wmi.NetLib.GetNetworkData();
		for (var i = 0; i < newNetworkData.length; i++) {
			var networkAdapter = newNetworkData[i];
			if (networkAdapter.Name == NetworkAdapterName) {
				received = formatBytes(networkAdapter.received, 'b');
				sent = formatBytes(networkAdapter.sent, 'b');
				break;
			}
		}
	}

	this.Draw = function () {
		NetReceived.innerHTML = received;
		NetSent.innerHTML = sent;
	}
}

function Start() {
	//debugger;
	dataElements.push(
		new CpuObj(),
		new RamObj(),
		new DriveObj(),
		new NetObj()
	);
	CalculateHeight();
	LoadSettings();
	
	wmi = new WmiObj();
	wmi.Start();
	StartTimer();
}

function SettingsClosed(event) {
	if (event.closeAction == event.Action.commit) {
		LoadSettings()
	}
}

function LoadSettings() {
	NetworkAdapterName = new SettingsIO().Read().NetworkAdapter;
}

function StartTimer() {
	timerId = setInterval(Update, 1000);
}

function StopTimer() {
	clearInterval(timerId);
}

function Stop() {
	StopTimer();
	wmi.Stop(true);
}

function Update() {
	dataElements.forEach(function (item) { item.Update(); });
	dataElements.forEach(function (item) { item.Draw(); });

	CalculateHeight();
}

function formatBytes(bytes, size) {
	if (size == "b") {
		if (bytes > 1073741824) return (bytes / 1073741824).toFixed(2) + ' Гб';
		if (bytes > 1048576) return (bytes / 1048576).toFixed(2) + ' Мб';
		if (bytes > 1024) return (bytes / 1024).toFixed(2) + ' Кб';
		return bytes + ' байт';
	}
	if (size == 'kb') {
		if (bytes > 1048576) return (bytes / 1048576).toFixed(2) + ' Гб';
		if (bytes > 1024) return (bytes / 1024).toFixed(2) + ' Мб';
		return bytes + ' Кб';
	}
	if (size == 'mb') {
		if (bytes > 1024) return (bytes / 1024).toFixed(2) + ' Гб';
		return bytes + ' Мб';
	}
}

function CalculateHeight() {
	var coresCount = dataElements[0].CoresCount();
	var drivesCount = dataElements[2].DrivesCount();

	cpuSect.style.height = 18 + coresCount * rowHeight;
	ramSect.style.height = 18 + 2 * rowHeight;
	hddSect.style.height = 3 * drivesCount * (rowHeight + 1);
	networkSect.style.height = 18 + 1 * rowHeight;
	document.body.style.height =
		parseInt(cpuSect.style.height) +
		parseInt(ramSect.style.height) +
		parseInt(hddSect.style.height) +
		parseInt(networkSect.style.height) + 3;
	bottom.style.top = parseInt(document.body.style.height) - 10;
	middle.style.height = parseInt(document.body.style.height) - 20;
}

function CalcWidthBar(percent) {
	return Math.round(percent * widthBar / 100);
}