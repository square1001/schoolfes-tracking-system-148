var last_update_time = new Date(1970, 1, 1);
function update_room_state_table() {
	var lastupdateref = firebase.database().ref("room-state/last-update");
	lastupdateref.once("value", function(snapshot_time) {
		var dt = snapshot_time.val();
		dt = (dt == null ? new Date(1980, 1, 1) : new Date(dt));
		if(last_update_time > dt) return;
		var simpleinforef = firebase.database().ref("sandan-info-simple");
		var roomstateref = firebase.database().ref("room-state");
		simpleinforef.once("value", function(snapshot_info) {
			roomstateref.once("value", function(snapshot) {
				var content = "";
				for(var i = 0; i < valid_place_sep.length; ++i) {
					content += "<tr>";
					for(var j = valid_place_sep[i]; j < valid_place_sep[i + 1]; ++j) {
						var id_str = fillzero(String(j), 2);
						var availability = snapshot.child("room-" + id_str + "/availability").val();
						var current_used = snapshot.child("room-" + id_str + "/current-used").val();
						if(availability == null) availability = true;
						if(current_used == null) current_used = [];
						// ------ Make one cell of the table ------ //
						var subcontent = "";
						subcontent += "<table style=\"width: 100px; padding: 0px; border: 0px; margin: 0px\">"
						subcontent += "<tr><td>" + valid_place[j] + "</td></tr>";
						subcontent += "<tr style=\"height: 70px; overflow: auto\">";
						if(!availability) {
							subcontent += "<td>✖</td></tr>";
						}
						else if(current_used.length == 0) {
							subcontent += "<td>Not used</td>";
						}
						else {
							subcontent += "<td style=\"text-align: left;\">";
							for(var k = 0; k < current_used.length; ++k) {
								subcontent += "<p style=\"padding: 0px; margin: 0px; font-size: 10px;\">" + current_used[k] + " - " + snapshot_info.child("sandan-" + current_used[k]).val() + "</p>";
							}
							subcontent += "</td>";
						}
						subcontent += "</tr>";
						subcontent += "</table>";
						content += "<td style=\"vertical-align: top; padding: 0px; margin: 0px; height: 100%\">" + subcontent + "</td>";
					}
					content += "</tr>";
				}
				last_update_time = new Date();
				document.getElementById("room-state-table").innerHTML = content;
				document.getElementById("last-update").innerHTML = "(" + get_time_string(last_update_time) + " 更新)";
			});
		});
	});
}
setInterval("update_room_state_table()", 7 * 1000);