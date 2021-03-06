﻿using WMI.DataClasses;

namespace WMI.DataProviders
{
	internal class NetworkDataProvider : DataProvider<NetworkInterface>
	{
		public NetworkDataProvider(int updateInterval)
			: base(updateInterval, new CanonicalComparer())
		{
			AddSearcher("Win32_PerfFormattedData_Tcpip_NetworkInterface", new PropertySettersDictionary<NetworkInterface>()
			{
				{"BytesReceivedPerSec", (@interface, o) => @interface.Received = (ulong) o},
				{"BytesSentPerSec", (@interface, o) => @interface.Sent = (ulong) o}
			}, canAddElements: false);
			AddSearcher("Win32_NetworkAdapter", new PropertySettersDictionary<NetworkInterface>(),
				@"Manufacturer != 'Microsoft' AND NOT PNPDeviceID LIKE 'ROOT\\%'", canRemoveElements: true);
		}
	}
}
