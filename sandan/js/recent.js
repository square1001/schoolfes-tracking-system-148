function get_recent_requests() {
	var reqyear = document.getElementById("requests-year").value;
	var reqmonth = document.getElementById("requests-month").value;
	var reqdate = document.getElementById("requests-date").value;
	if(!is_number(reqyear) || !is_number(reqmonth) || !is_number(reqdate)) {
		document.getElementById("recent-requests-message").innerHTML = "日付には数値を入力してください。";
		return;
	}
	reqyear = parseInt(reqyear);
	reqmonth = parseInt(reqmonth - 1);
	reqdate = parseInt(reqdate);
	if(!is_valid_date(reqyear, reqmonth, reqdate)) {
		document.getElementById("recent-requests-message").innerHTML = "1 年 1 月 1 日から 9999 年 12 月 31 日までの正しい日付を入力してください。";
		return;
	}
	var dt = new Date();
	dt.setFullYear(reqyear);
	dt.setMonth(reqmonth);
	dt.setDate(reqdate);
	var date_string = get_date_string(dt);
	var requests_number_object = document.getElementById("requests-number");
	var requests_number = requests_number_object.options[requests_number_object.selectedIndex].value;
	var requestsref = firebase.database().ref("requests/" + date_string);
	if(requests_number != "All") requestsref = requestsref.limitToLast(parseInt(requests_number));
	var simpleinforef = firebase.database().ref("sandan-info-simple");
	document.getElementById("recent-requests-message").innerHTML = "データを取得中です・・・";
	simpleinforef.once("value", function(snapshot_sandan) {
		requestsref.once("value", function(snapshot) {
			var activity_dict = {};
			var sandan_room_queue = {};
			snapshot.forEach(i => {
				var type = i.child("type").val();
				if(type.indexOf("activity") != -1) {
					var current_sandan = "sandan-" + i.child("sandan-id").val();
					var request_id = parseInt(i.key.substr(8)); // take "xxxxxx" from i.key = "request-xxxxxx"
					var place = i.child("place").val();
					if(type == "activity-start") {
						activity_dict[request_id] = {
							start_time: null,
							finish_time: null,
							place: "",
							responsible_id: "",
							responsible_name: "",
							editor_start_id: "",
							editor_start_name: "",
							editor_finish_id: "",
							editor_finish_name: ""
						};
						activity_dict[request_id].start_time = new Date(i.child("time").val());
						activity_dict[request_id].editor_start_id = i.child("editor-id").val();
						activity_dict[request_id].editor_start_name = i.child("editor-name").val();
						sandan_room_queue[[current_sandan, place]] = request_id;
					}
					if(type == "activity-finish") {
						var pre_id = sandan_room_queue[[current_sandan, place]];
						if(pre_id) {
							activity_dict[request_id] = activity_dict[pre_id];
							delete activity_dict[pre_id];
							delete sandan_room_queue[[current_sandan, place]];
						}
						activity_dict[request_id].finish_time = new Date(i.child("time").val());
						activity_dict[request_id].editor_finish_id = i.child("editor-id").val();
						activity_dict[request_id].editor_finish_name = i.child("editor-name").val();
					}
					activity_dict[request_id].place = place;
					activity_dict[request_id].responsible_id = i.child("responsible-id").val();
					activity_dict[request_id].responsible_name = i.child("responsible-name").val();
				}
			});
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
			accident_content += "<th width=\"450\">事故内容</th>";
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
			penalty_content += "<th width=\"225\">ペナルティー内容</th>";
			penalty_content += "<th width=\"225\">理由</th>";
			penalty_content += "</tr>";
			snapshot.forEach(i => {
				var sandan_id = i.child("sandan-id").val();
				var sandan_name = snapshot_sandan.child("sandan-" + sandan_id).val();
				var request_id = parseInt(i.key.substring(8)); // take "xxxxxx" from "request-xxxxxx"
				var type = i.child("type").val();
				var subcontent = "";
				subcontent += "<tr>";
				subcontent += "<td>" + request_id + "</td>";
				subcontent += "<td>" + sandan_id + "</td>";	
				subcontent += "<td>" + sandan_name + "</td>";
				if(type.indexOf("activity") != -1 && activity_dict[request_id]) {
					subcontent += "<td>" + (activity_dict[request_id].start_time == null ? "" : get_time_string(activity_dict[request_id].start_time)) + "</td>";
					subcontent += "<td>" + (activity_dict[request_id].finish_time == null ? "" : get_time_string(activity_dict[request_id].finish_time)) + "</td>";
					subcontent += "<td>" + (activity_dict[request_id].place) + "</td>";
					subcontent += "<td>" + (activity_dict[request_id].responsible_id) + "</td>";
					subcontent += "<td>" + (activity_dict[request_id].responsible_name) + "</td>";
					subcontent += "</tr>";
					activity_content += subcontent;
				}
				if(type == "accident") {
					var dt = new Date(i.child("time").val());
					subcontent += "<td>" + (dt.toLocaleDateString() + " " + dt.toLocaleTimeString()) + "</td>";
					subcontent += "<td>" + i.child("content").val() + "</td>";
					subcontent += "</tr>";
					accident_content += subcontent;
				}
				if(type == "progress") {
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
				if(type == "penalty") {
					var dt = new Date(i.child("time").val());
					subcontent += "<td>" + (dt.toLocaleDateString() + " " + dt.toLocaleTimeString()) + "</td>";
					subcontent += "<td>" + i.child("penalty-old").val();
					subcontent += "<td>" + i.child("penalty-new").val();
					subcontent += "<td>" + i.child("reason").val();
					subcontent += "</tr>";
					penalty_content += subcontent;
				}
			});
			document.getElementById("recent-activity-table").innerHTML = activity_content;
			document.getElementById("recent-accident-table").innerHTML = accident_content;
			document.getElementById("recent-progress-table").innerHTML = progress_content;
			document.getElementById("recent-penalty-table").innerHTML = penalty_content;
			document.getElementById("recent-requests").style.display = "block";
			document.getElementById("recent-requests-message").innerHTML = "データが取得できました！";
		});
	});
}