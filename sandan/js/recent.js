function get_recent_requests() {
	var requests_number_object = document.getElementById("requests-number");
	var requests_number = parseInt(requests_number_object.options[requests_number_object.selectedIndex].value);
	var requestsref = firebase.database().ref("requests").limitToLast(requests_number).orderByKey();
	var simpleinforef = firebase.database().ref("sandan-info-simple");
	simpleinforef.once("value", function(snapshot_sandan) {
		requestsref.once("value", function(snapshot) {
			var prefix_content = "";
			prefix_content += "<tr>";
			prefix_content += "<th>#</th>";
			prefix_content += "<th colspan=\"2\">参団名</th>"
			var activity_content = prefix_content;
			activity_content += "<th>開始時刻</th>";
			activity_content += "<th>終了時刻</th>";
			activity_content += "<th>活動場所</th>";
			activity_content += "<th colspan=\"2\">活動責任者</th>";
			activity_content += "</tr>";
			var accident_content = prefix_content;
			accident_content += "<th>時刻</th>";
			accident_content += "<th width=\"400\">事故内容</th>";
			accident_content += "</tr>";
			var progress_content = prefix_content;
			progress_content += "<th>時刻</th>";
			progress_content += "<th colspan=\"2\">パネル作業</th>";
			progress_content += "<th colspan=\"2\">特殊組木作業</th>";
			progress_content += "<th colspan=\"2\">輪転作業</th>";
			progress_content += "<th colspan=\"2\">その他屋内作業</th>";
			progress_content += "</tr>";
			var penalty_content = prefix_content;
			penalty_content += "<th>時刻</th>";
			penalty_content += "<th colspan=\"2\">ペナルティー値</th>";
			penalty_content += "<th width=\"320\">理由</th>";
			penalty_content += "</tr>";
			snapshot.forEach(i => {
				if(i.key.substr(0, 7) == "request") {
					var sandanref = snapshot_sandan.child("sandan-" + i.child("sandan-id").val());
					var subcontent = "";
					subcontent += "<tr>";
					subcontent += "<td>" + parseInt(i.key.substring(8)) + "</td>"; // take "xxxxxx" from "request-xxxxxx"
					subcontent += "<td>" + i.child("sandan-id").val() + "</td>";	
					subcontent += "<td>" + sandanref.child("sandan-name").val() + "</td>";
					if(i.child("type").val() == "activity") {
						var dt_start = i.child("start-time").val();
						if(dt_start != null) dt_start = new Date(dt_start);
						var dt_finish = i.child("finish-time").val();
						if(dt_finish != null) dt_finish = new Date(dt_finish);
						subcontent += "<td>" + (dt_start == null ? "" : dt_start.toLocaleDateString() + " " + dt_start.toLocaleTimeString()) + "</td>";
						subcontent += "<td>" + (dt_finish == null ? "" : dt_finish.toLocaleDateString() + " " + dt_finish.toLocaleTimeString()) + "</td>";
						subcontent += "<td>" + i.child("place").val() + "</td>";
						subcontent += "<td>" + i.child("responsible-id").val() + "</td>";
						subcontent += "<td>" + i.child("responsible-name").val()+ "</td>";
						subcontent += "</tr>";
						activity_content += subcontent;
					}
					if(i.child("type").val() == "accident") {
						var dt = new Date(i.child("time").val());
						subcontent += "<td>" + (dt.toLocaleDateString() + " " + dt.toLocaleTimeString()) + "</td>";
						subcontent += "<td>" + i.child("content").val() + "</td>";
						subcontent += "</tr>";
						accident_content += subcontent;
					}
					if(i.child("type").val() == "progress") {
						var dt = new Date(i.child("time").val());
						var progress_old = i.child("progress-old").val();
						var progress_new = i.child("progress-new").val();
						subcontent += "<td>" + (dt.toLocaleDateString() + " " + dt.toLocaleTimeString()) + "</td>";
						for(var j = 0; j < 4; ++j) {
							subcontent += "<td>" + progress_old[j] + "%</td>";
							subcontent += "<td>" + progress_new[j] + "%</td>";
						}
						subcontent += "</tr>";
						progress_content += subcontent;
					}
					if(i.child("type").val() == "penalty") {
						var dt = new Date(i.child("time").val());
						subcontent += "<td>" + (dt.toLocaleDateString() + " " + dt.toLocaleTimeString()) + "</td>";
						subcontent += "<td>" + i.child("penalty-old").val();
						subcontent += "<td>" + i.child("penalty-new").val();
						subcontent += "<td>" + i.child("reason").val();
						subcontent += "</tr>";
						penalty_content += subcontent;
					}
				}
			});
			document.getElementById("recent-activity-table").innerHTML = activity_content;
			document.getElementById("recent-accident-table").innerHTML = accident_content;
			document.getElementById("recent-progress-table").innerHTML = progress_content;
			document.getElementById("recent-penalty-table").innerHTML = penalty_content;
			document.getElementById("recent-requests").style.display = "block";
		});
	});
}