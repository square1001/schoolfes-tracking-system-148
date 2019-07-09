// ---------- VALID PLACE ARRAY ---------- //
var valid_place = [
	"1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
	"H1-1", "H1-2", "H1-3", "H1-4", "H1-5", "H1-6", "H1-7", "H1-8",
	"H2-1", "H2-2", "H2-3", "H2-4", "H2-5", "H2-6", "H2-7", "H2-8",
	"H3-1", "H3-2", "H3-3", "H3-4", "H3-5", "H3-6", "H3-7", "H3-8",
	"予備教室2", "予備教室3", "予備教室4", "その他"
];

// ---------- UPDATE ROOM STATUS ---------- //
var last_update_time = new Date(1970, 1, 1);
function update_room_state_table() {
	var lastupdateref = firebase.database().ref("room-state/last-update");
	lastupdateref.once("value", function(snapshot_time) {
		var dt = snapshot_time.val();
		dt = (dt == null ? new Date(1980, 1, 1) : new Date(dt));
		if(last_update_time < dt) {
			var simpleinforef = firebase.database().ref("sandan-info-simple");
			var roomstateref = firebase.database().ref("room-state");
			simpleinforef.once("value", function(snapshot_info) {
				roomstateref.once("value", function(snapshot) {
					var content = "";
					content += "<tr>";
					content += "<th colspan=\"2\">活動場所</th>"
					content += "<th colspan=\"2\">参団名</th>";
					content += "</tr>";
					for(var i = 0; i < valid_place.length; ++i) {
						var id_str = fillzero(String(i), 2);
						var availability = snapshot.child("room-" + id_str + "/availability").val();
						var current_used = snapshot.child("room-" + id_str + "/current-used").val();
						if(availability == null) availability = true;
						if(current_used == null) current_used = [];
						// ------ Make one row of the table ------ //
						var subcontent = "";
						if(!availability) {
							subcontent += "<tr>";
							subcontent += "<td>" + i + "</td>";
							subcontent += "<td>" + valid_place[i] + "</td>";
							subcontent += "<td colspan=\"2\">この活動場所は現在使用することができません。</td>"
							subcontent += "</tr>";
						}
						else if(current_used.length == 0) {
							subcontent += "<tr>";
							subcontent += "<td>" + i + "</td>";
							subcontent += "<td>" + valid_place[i] + "</td>";
							subcontent += "<td colspan=\"2\">この活動場所は現在どの参団にも使われていません。</td>";
							subcontent += "</tr>";
						}
						else {
							for(var j = 0; j < current_used.length; ++j) {
								subcontent += "<tr>";
								if(j == 0) {
									subcontent += "<td rowspan=\"" + current_used.length + "\">" + i + "</td>";
									subcontent += "<td rowspan=\"" + current_used.length + "\">" + valid_place[i] + "</td>";
								}
								subcontent += "<td>" + current_used[j] + "</td>";
								subcontent += "<td>" + snapshot_info.child("sandan-" + current_used).val() + "</td>";
								subcontent += "</tr>";
							}
						}
						content += subcontent;
					}
					last_update_time = new Date();
					document.getElementById("room-state-table").innerHTML = content;
					document.getElementById("last-update").innerHTML = "(" + get_time_string(last_update_time) + " 更新)";
				});
			});
		}
	});
}
setInterval("update_room_state_table()", 6 * 1000);