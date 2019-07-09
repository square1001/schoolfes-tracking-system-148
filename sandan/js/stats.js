// ---------- Make List of Basic Informations ---------- //
function set_information_list() {
	var sandan_object = document.getElementById("sandan-option");
	var current_sandan = sandan_object.options[sandan_object.selectedIndex].value;
	var inforef = firebase.database().ref().child("sandan-info/" + current_sandan);
	inforef.once("value", function(snapshot) {
		var content = "";
		content += "<li>参団名：　" + snapshot.child("sandan-name").val() + "</li>";
		content += "<li>参団番号：　" + snapshot.key.substring(7) + "</li>"; // take "xx" from "sandan-xx"
		if(snapshot.child("chief-id").val() != null) {
			content += "<li>参団責任者：　" + snapshot.child("chief-id").val() + "　" + snapshot.child("chief-name").val() + "</li>";
		}
		if(snapshot.child("subchief-id").val() != null) {
			content += "<li>参団副責任者：　" + snapshot.child("subchief-id").val() + "　" + snapshot.child("subchief-name").val() + "</li>";
		}
		if(snapshot.child("supervisor-id").val() != null) {
			content += "<li>顧問：　" + snapshot.child("supervisor-id").val() + "　" + snapshot.child("supervisor-name").val() + "</li>";
		}
		if(snapshot.child("contact").val() != null) {
			content += "<li>連絡先：　" + snapshot.child("contact").val() + "</li>";
		}
		document.getElementById("info-list").innerHTML = content;
	});
}

// ---------- Make Table of Activities of SANDAN ---------- //
function set_activity_table() {
	document.getElementById("activity-table-message").innerHTML = "データを取得中です・・・";
	var sandan_object = document.getElementById("sandan-option");
	var current_sandan = sandan_object.options[sandan_object.selectedIndex].value;
	var activity_ref = firebase.database().ref("activities/" + current_sandan);
	activity_ref.once("value", function(snapshot) {
		var activity_dict = {};
		var sandan_room_queue = {};
		snapshot.forEach(i => {
			var request_id = parseInt(i.key.substr(8)); // take "xxxxxx" from i.key = "request-xxxxxx"
			var place = i.child("place").val();
			var type = i.child("type").val();
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
		});
		var content = "";
		content += "<tr>";
		content += "<th>#</th>";
		content += "<th>開始時刻</th>";
		content += "<th>終了時刻</th>";
		content += "<th>活動場所</th>";
		content += "<th colspan=\"2\">活動責任者</th>";
		content += "<th colspan=\"2\">入力者 (開始報告)</th>";
		content += "<th colspan=\"2\">入力者 (終了報告)</th>";
		content += "</tr>";
		for(var key in activity_dict) {
			var subcontent = "";
			subcontent += "<tr>";
			subcontent += "<td>" + key + "</td>"; // take "xxxxxx" from i.key = "request-xxxxxx"
			subcontent += "<td>" + (activity_dict[key].start_time == null ? "" : get_time_string(activity_dict[key].start_time)) + "</td>";
			subcontent += "<td>" + (activity_dict[key].finish_time == null ? "" : get_time_string(activity_dict[key].finish_time)) + "</td>";
			subcontent += "<td>" + (activity_dict[key].place) + "</td>";
			subcontent += "<td>" + (activity_dict[key].responsible_id) + "</td>";
			subcontent += "<td>" + (activity_dict[key].responsible_name) + "</td>";
			subcontent += "<td>" + (activity_dict[key].editor_start_id) + "</td>";
			subcontent += "<td>" + (activity_dict[key].editor_start_name) + "</td>";
			subcontent += "<td>" + (activity_dict[key].editor_finish_id) + "</td>";
			subcontent += "<td>" + (activity_dict[key].editor_finish_name) + "</td>";
			subcontent += "</tr>";
			content += subcontent;
		};
		document.getElementById("activity-table-message").innerHTML = "";
		document.getElementById("activity-table").innerHTML = content;
	});
}

// ---------- Make list of accidents ---------- //
function set_accident_table() {
	document.getElementById("accident-table-message").innerHTML = "データを取得中です・・・";
	var sandan_object = document.getElementById("sandan-option");
	var current_sandan = sandan_object.options[sandan_object.selectedIndex].value;
	var accident_ref = firebase.database().ref("accidents/" + current_sandan);
	accident_ref.once("value", function(snapshot) {
		var content = "";
		content += "<tr>";
		content += "<th>#</th>";
		content += "<th>記入時刻</th>";
		content += "<th width=\"500\">事故内容</th>";
		content += "<th colspan=\"2\">入力者</th>";
		content += "</tr>";
		snapshot.forEach(i => {
			var dt = new Date(i.child("time").val());
			var subcontent = "";
			subcontent += "<tr>";
			subcontent += "<td>" + parseInt(i.key.substr(8)) + "</td>"; // take "xxxxxx" from i.key = "request-xxxxxx"
			subcontent += "<td>" + (get_time_string(dt)) + "</td>";
			subcontent += "<td>" + (i.child("content").val()) + "</td>";
			subcontent += "<td>" + (i.child("editor-id").val()) + "</td>";
			subcontent += "<td>" + (i.child("editor-name").val()) + "</td>";
			subcontent += "</tr>";
			content += subcontent;
		});
		document.getElementById("accident-table-message").innerHTML = "";
		document.getElementById("accident-table").innerHTML = content;
	});
}

// ---------- Make a list of progresses ---------- //
function set_progress_table() {
	document.getElementById("progress-table-message").innerHTML = "データを取得中です・・・";
	var sandan_object = document.getElementById("sandan-option");
	var current_sandan = sandan_object.options[sandan_object.selectedIndex].value;
	var progressref = firebase.database().ref("progresses/" + current_sandan);
	progressref.once("value", function(snapshot) {
		var content = "";
		content += "<tr>";
		content += "<th>#</th>";
		content += "<th>記入時刻</th>";
		content += "<th colspan=\"2\">パネル作業</th>";
		content += "<th colspan=\"2\">特殊組木作業</th>";
		content += "<th colspan=\"2\">輪転作業</th>";
		content += "<th colspan=\"2\">その他屋内作業</th>";
		content += "<th colspan=\"2\">入力者</th>";
		content += "</tr>";
		snapshot.forEach(i => {
			var dt = new Date(i.child("time").val());
			var subcontent = "";
			subcontent += "<tr>";
			subcontent += "<td>" + parseInt(i.key.substr(8)) + "</td>"; // take "xxxxxx" from i.key = "request-xxxxxx"
			subcontent += "<td>" + (get_time_string(dt)) + "</td>";
			var progress_old = i.child("progress-old").val();
			var progress_new = i.child("progress-new").val();
			for(var j = 0; j < 4; ++j) {
				subcontent += "<td>" + progress_old[j] + "%</td>";
				subcontent += "<td>" + progress_new[j] + "%</td>";
			}
			subcontent += "<td>" + (i.child("editor-id").val()) + "</td>";
			subcontent += "<td>" + (i.child("editor-name").val()) + "</td>";
			subcontent += "</tr>";
			content += subcontent;
		});
		document.getElementById("progress-table-message").innerHTML = "";
		document.getElementById("progress-table").innerHTML = content;
	});
}

// ---------- Make a list of penalties  ---------- //
function set_penalty_table() {
	document.getElementById("penalty-table-message").innerHTML = "データを取得中です・・・";
	var sandan_object = document.getElementById("sandan-option");
	var current_sandan = sandan_object.options[sandan_object.selectedIndex].value;
	var progressref = firebase.database().ref("penalties/" + current_sandan);
	progressref.once("value", function(snapshot) {
		var content = "";
		content += "<tr>";
		content += "<th>#</th>";
		content += "<th>記入時刻</th>";
		content += "<th width=\"225\">ペナルティー値</th>";
		content += "<th width=\"225\">理由</th>";
		content += "<th colspan=\"2\">入力者</th>";
		content += "</tr>";
		snapshot.forEach(i => {
			var dt = new Date(i.child("time").val());
			var subcontent = "";
			subcontent += "<tr>";
			subcontent += "<td>" + parseInt(i.key.substr(8)) + "</td>"; // take "xxxxxx" from i.key = "request-xxxxxx"
			subcontent += "<td>" + (get_time_string(dt)) + "</td>";
			subcontent += "<td>" + (i.child("penalty").val()) + "</td>";
			subcontent += "<td>" + (i.child("reason").val()) + "</td>";
			subcontent += "<td>" + (i.child("editor-id").val()) + "</td>";
			subcontent += "<td>" + (i.child("editor-name").val()) + "</td>";
			subcontent += "</tr>";
			content += subcontent;
		});
		document.getElementById("penalty-table-message").innerHTML = "";
		document.getElementById("penalty-table").innerHTML = content;
	});
}

// ---------- MAIN FUNCTION TO SET EVERYTHING ---------- //
function set_everything() {
	var sandan_object = document.getElementById("sandan-option");
	var current_sandan = sandan_object.options[sandan_object.selectedIndex].value;
	if(current_sandan == "none") {
		document.getElementById("button-message").innerHTML = "参団が選択されていません。";
	}
	else {
		document.getElementById("button-message").innerHTML = "";
		document.getElementById("stats-main").style = "display: block";
		set_information_list();
		set_activity_table();
		set_accident_table();
		set_progress_table();
		set_penalty_table();
	}
}