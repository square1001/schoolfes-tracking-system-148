function set_attendance_record_table() {
	var attendanceref = firebase.database().ref("committee/attendance");
	attendanceref.once("value", function(snapshot) {
		var attendance_dict = {};
		var dayslist = [];
		snapshot.forEach(i => {
			var arr = i.val();
			for(var j = 0; j < arr.length; ++j) {
				if(!attendance_dict[arr[j].id]) {
					attendance_dict[arr[j].id] = { name: "", attend: [] };
				}
				attendance_dict[arr[j].id].name = arr[j].name;
				attendance_dict[arr[j].id].attend.push(i.key);
			}
			dayslist.push(i.key);
		});
		var content = "";
		content += "<tr>";
		content += "<th colspan=\"2\">名前</th>";
		for(var i = 0; i < dayslist.length; ++i) {
			var date_parse = parseInt(dayslist[i].substring(5, 7)) + "/" + parseInt(dayslist[i].substring(8, 10));
			content += "<th style=\"width: 45px\">" + date_parse + "</th>";
		}
		content += "</tr>";
		for(var i in attendance_dict) {
			var subcontent = "";
			subcontent += "<tr>";
			subcontent += "<td>" + i + "</td>";
			subcontent += "<td>" + attendance_dict[i].name + "</td>";
			var attendlist = attendance_dict[i].attend;
			for(var j = 0; j < dayslist.length; ++j) {
				if(attendlist.indexOf(dayslist[j]) != -1) {
					subcontent += "<td>〇</td>";
				}
				else {
					subcontent += "<td>✖</td>";
				}
			}
			content += subcontent;
		}
		document.getElementById("attendance-record-table").innerHTML = content;
	});
}