// ---------- SANDAN ACTIVITY REPORT SUBMISSION ---------- //
function change_verdict_activity(res) {
	var message;
	if(res == -1) {
		message = "ログアウトされています。";
	}
	if(res == -2) {
		message = "活動場所が正しくありません。";
	}
	if(res == -3) {
		message = "活動責任者の 4 桁番号または氏名が正しくありません。";
	}
	if(res == -4) {
		message = "開始しているのに開始報告を出している、あるいは終了しているのに終了報告を出しています。";
	}
	if(res == -5) {
		message = "活動可能区分が「✖」になっています。";
	}
	if(res == 0) {
		document.getElementById("activity-report-place").value = "";
		document.getElementById("activity-report-student-id").value = "";
		document.getElementById("activity-report-student-name").value = "";
		message = "入力に成功しました！"
	}
	document.getElementById("activity-report-message").innerHTML = message;
}
function update_active_day(sandan_id) {
	var today = get_date_string(new Date());
	var activedaysref = firebase.database().ref("sandan-active-days/sandan-" + sandan_id);
	activedaysref.once("value", function(snapshot) {
		var active_days = snapshot.val();
		if(active_days == null) active_days = [];
		if(active_days.indexOf(today) == -1) {
			active_days.push(today);
			activedaysref.set(active_days);
		}
	});
}
function report_activity() {
	// ---------- Getting Variables ---------- //
	var type_object = document.getElementById("activity-report-type");
	var type = type_object.options[type_object.selectedIndex].value;
	var place = document.getElementById("activity-report-place").value;
	var student_id = document.getElementById("activity-report-student-id").value;
	var student_name = document.getElementById("activity-report-student-name").value;
	var sandan_object = document.getElementById("sandan-option");
	var sandan_id = sandan_object.options[sandan_object.selectedIndex].value.substring(7); // takes "xx" from "sandan-xx"
	var requestsref = firebase.database().ref("requests");
	var activitiesref = firebase.database().ref("activities/sandan-" + sandan_id);
	var room_id = valid_place.indexOf(place);
	var room_id_str = String(room_id);
	while(room_id_str.length < 2) room_id_str = "0" + room_id_str;
	var roomstateref = firebase.database().ref("room-state/room-" + room_id_str);
	var editor_id = get_editor_id();
	var nameresref = firebase.database().ref("names/student-" + student_id);
	var nameediref = firebase.database().ref("names/student-" + editor_id);

	var update_room_state = function(current_used) {
		roomstateref.child("current-used").set(current_used);
		firebase.database().ref("room-state/last-update").set((new Date()).getTime());
	};
	var send_data = function() {
		roomstateref.once("value", function(snapshot_room) {
			var availability = snapshot_room.child("availability").val();
			var current_used = snapshot_room.child("current-used").val();
			if(availability == null) availability = true;
			if(current_used == null) current_used = [];
			if(availability) {
				var is_open = (current_used.indexOf(sandan_id) == -1);
				if((is_open && type == "start") || (!is_open && type == "finish")) {
					requestsref.child("current-id").once("value", function(snapshot_id) {
						nameresref.once("value", function(snapshot_res) {
							nameediref.once("value", function(snapshot_edi) {
								// ------ Next Key Generation ------ //
								var nxtkey = snapshot_id.val();
								nxtkey = (nxtkey == null ? 1 : nxtkey + 1);
								var nxtkeystr = fillzero(String(nxtkey), 6);
								requestsref.child("current-id").set(nxtkey);

								// ------ Update Data ------ //
								var updates = {};
								updates["/type"] = "activity-" + type;
								updates["/time"] = (new Date()).getTime();
								updates["/place"] = place;
								updates["/responsible-id"] = student_id;
								updates["/responsible-name"] = snapshot_res.child("name-kanji").val();
								updates["/editor-id"] = editor_id;
								updates["/editor-name"] = snapshot_edi.child("name-kanji").val();
								if(type == "start") {
									current_used.push(sandan_id);
									update_active_day(sandan_id);
								}
								if(type == "finish") {
									current_used.splice(current_used.indexOf(sandan_id), 1);
								}
								activitiesref.child("request-" + nxtkeystr).update(updates);
								updates["/sandan-id"] = sandan_id;
								requestsref.child(get_date_string(new Date())).child("request-" + nxtkeystr).update(updates);
								update_room_state(current_used);
								change_verdict_activity(0);
							});
						});
					});
				}
				else {
					change_verdict_activity(-4);
				}
			}
			else {
				change_verdict_activity(-5);
			}
		});
	}
	
	// ---------- Error Judgement ---------- //
	if(document.cookie.indexOf("login-id=") == -1) {
		// when NOT LOGGED IN
		change_verdict_activity(-1);
		return;
	}
	if(valid_place.indexOf(place) == -1) {
		// when PLACE IS INVALID
		change_verdict_activity(-2);
		return;
	}
	check_name(student_id, student_name).then(function() {
		send_data();
	}, function() {
		change_verdict_activity(-3); // when NOT-MATCHED
	});
}

// ---------- Report Accident ---------- //
function report_accident() {
	var sandan_object = document.getElementById("sandan-option");
	var sandan_id = sandan_object.options[sandan_object.selectedIndex].value.substring(7); // takes "xx" from "sandan-xx"
	var content = document.getElementById("accident-content").value;
	var requestsref = firebase.database().ref("requests");
	var accilistref = firebase.database().ref("accidents/sandan-" + sandan_id);
	var editor_id = get_editor_id();
	var nameediref = firebase.database().ref("names/student-" + editor_id);
	nameediref.once("value", function(snapshot_edi) {
		requestsref.child("current-id").once("value", function(snapshot_id) {
			var nxtkey = snapshot_id.val();
			nxtkey = (nxtkey == null ? 1 : nxtkey + 1);
			var nxtkeystr = fillzero(String(nxtkey), 6);
			
			// ------ Update Data ------ //
			var updates = {};
			updates["/content"] = content;
			updates["/time"] = (new Date()).getTime();
			updates["/editor-id"] = editor_id;
			updates["/editor-name"] = snapshot_edi.child("name-kanji").val();
			accilistref.child("request-" + nxtkeystr).update(updates);
			updates["/sandan-id"] = sandan_id;
			updates["/type"] = "accident";
			requestsref.child("current-id").set(nxtkey);
			requestsref.child(get_date_string(new Date())).child("request-" + nxtkeystr).update(updates);
		});
	});
}

// ---------- Get Progress ---------- //
function get_progress_penalty() {
	var sandan_object = document.getElementById("sandan-option");
	var sandan_id = sandan_object.options[sandan_object.selectedIndex].value.substring(7); // takes "xx" from "sandan-xx"
	var inforef = firebase.database().ref("sandan-info/sandan-" + sandan_id);
	inforef.once("value", function(snapshot) {
		var progress = snapshot.child("progress").val();
		if(progress == null) progress = [ 0, 0, 0, 0 ];
		var penalty = snapshot.child("penalty").val();
		if(penalty == null) penalty = 0;
		document.getElementById("progress-type-1-label").innerHTML = "パネル作業 (現在：" + progress[0] + " %)";
		document.getElementById("progress-type-2-label").innerHTML = "特殊組木作業 (現在：" + progress[1] + " %)";
		document.getElementById("progress-type-3-label").innerHTML = "輪転作業 (現在：" + progress[2] + " %)";
		document.getElementById("progress-type-4-label").innerHTML = "その他屋内作業 (現在：" + progress[3] + " %)";
		document.getElementById("penalty-label").innerHTML = "ペナルティー (現在：" + penalty + ")";
		document.getElementById("input-main").style = "display: block;";
	});
}

// ---------- Report Progress / Penalty ---------- //
function is_number_empty(str) {
	if(str == "") return true;
	if(is_number(str)) return true;
	return false;
}
function report_progress() {
	var data_type_1 = document.getElementById("progress-type-1").value;
	var data_type_2 = document.getElementById("progress-type-2").value;
	var data_type_3 = document.getElementById("progress-type-3").value;
	var data_type_4 = document.getElementById("progress-type-4").value;
	var send_data = function() {
		var sandan_object = document.getElementById("sandan-option");
		var sandan_id = sandan_object.options[sandan_object.selectedIndex].value.substring(7); // takes "xx" from "sandan-xx"
		var inforef = firebase.database().ref("sandan-info/sandan-" + sandan_id);
		var progressref = firebase.database().ref("progresses/sandan-" + sandan_id);
		var requestsref = firebase.database().ref("requests");
		var editor_id = get_editor_id();
		var nameediref = firebase.database().ref("names/student-" + editor_id);
		nameediref.once("value", function(snapshot_edi) {
			inforef.once("value", function(snapshot) {
				requestsref.child("current-id").once("value", function(snapshot_id) {
					var nxtkey = snapshot_id.val();
					nxtkey = (nxtkey == null ? 1 : nxtkey + 1);
					var nxtkeystr = fillzero(String(nxtkey), 6)

					// ------ Update Progress ------ //
					var progress = snapshot.child("progress").val();
					if(progress == null) progress = [ 0, 0, 0, 0 ];
					var progress_new = [
						(data_type_1 != "" ? parseInt(data_type_1) : progress[0]),
						(data_type_2 != "" ? parseInt(data_type_2) : progress[1]),
						(data_type_3 != "" ? parseInt(data_type_3) : progress[2]),
						(data_type_4 != "" ? parseInt(data_type_4) : progress[3])
					];
					var updates = {};
					updates["/progress-old"] = progress;
					updates["/progress-new"] = progress_new;
					updates["/time"] = (new Date()).getTime();
					updates["/editor-id"] = editor_id;
					updates["/editor-name"] = snapshot_edi.child("name-kanji").val();
					progressref.child("request-" + nxtkeystr).update(updates);
					updates["/sandan-id"] = sandan_id;
					updates["/type"] = "progress";
					requestsref.child("current-id").set(nxtkey);
					requestsref.child(get_date_string(new Date())).child("request-" + nxtkeystr).update(updates);
					inforef.child("progress").set(progress_new);
					document.getElementById("progress-report-message").innerHTML = "正常に更新されました。";
					document.getElementById("progress-type-1").value = "";
					document.getElementById("progress-type-2").value = "";
					document.getElementById("progress-type-3").value = "";
					document.getElementById("progress-type-4").value = "";
					get_progress_penalty();
				});
			});
		});
	}
	if(data_type_1 == "" && data_type_2 == "" && data_type_3 == "" && data_type_4 == "") {
		document.getElementById("progress-report-message").innerHTML = "値が入力されていません。";
	}
	else if(!is_number_empty(data_type_1) || !is_number_empty(data_type_2) || !is_number_empty(data_type_3) || !is_number_empty(data_type_4)) {
		document.getElementById("progress-report-message").innerHTML = "正の整数値を入力してください。";
	}
	else if(parseInt(data_type_1) > 100 || parseInt(data_type_2) > 100 || parseInt(data_type_3) > 100 || parseInt(data_type_4) > 100) {
		document.getElementById("progress-report-message").innerHTML = "0 以上 100 以下の整数値を入力してください。";
	}
	else {
		send_data();
	}
}
function report_penalty() {
	var penalty = document.getElementById("penalty").value;
	var reason = document.getElementById("penalty-reason").value;
	var password = document.getElementById("password-input").value;
	var send_data = function() {
		var sandan_object = document.getElementById("sandan-option");
		var sandan_id = sandan_object.options[sandan_object.selectedIndex].value.substring(7); // takes "xx" from "sandan-xx"
		var inforef = firebase.database().ref("sandan-info/sandan-" + sandan_id);
		var penaltyref = firebase.database().ref("penalties/sandan-" + sandan_id);
		var requestsref = firebase.database().ref("requests");
		var editor_id = get_editor_id();
		var nameediref = firebase.database().ref("names/student-" + editor_id);
		nameediref.once("value", function(snapshot_edi) {
			inforef.once("value", function(snapshot) {
				requestsref.child("current-id").once("value", function(snapshot_id) {
					var nxtkey = snapshot_id.val();
					nxtkey = (nxtkey == null ? 1 : nxtkey + 1);
					var nxtkeystr = fillzero(String(nxtkey), 6);

					// ------ Update Penalty ------ //
					var updates = {};
					updates["/penalty"] = penalty;
					updates["/reason"] = reason;
					updates["/completed"] = false;
					updates["/time"] = (new Date()).getTime();
					updates["/editor-id"] = editor_id;
					updates["/editor-name"] = snapshot_edi.child("name-kanji").val();
					penaltyref.child("request-" + nxtkeystr).update(updates);
					updates["/sandan-id"] = sandan_id;
					updates["/type"] = "penalty";
					requestsref.child("current-id").set(nxtkey);
					requestsref.child(get_date_string(new Date())).child("request-" + nxtkeystr).update(updates);
					inforef.child("penalty").set(penalty);
					document.getElementById("penalty-report-message").innerHTML = "正常に更新されました。";
					document.getElementById("penalty").value = "";
					document.getElementById("penalty-reason").value = "";
					document.getElementById("password-input").value = "";
					get_progress_penalty();
				});
			});
		});
	}
	if(penalty == "" || reason == "") {
		document.getElementById("penalty-report-message").innerHTML = "入力されていない箇所があります。";
	}
	else if(penalty.length < 7) {
		document.getElementById("penalty-report-message").innerHTML = "ペナルティーは 7 文字以上でなければなりません。";
	}
	else if(reason.length < 15) {
		document.getElementById("penalty-report-message").innerHTML = "理由は 15 文字以上でなければなりません。";
	}
	else {
		check_password(password).then(function(status) {
			if(status == "executive" || status == "admin") {
				send_data();
			}
			else {
				document.getElementById("penalty-report-message").innerHTML = "総務用または管理者のパスワードを入力してください。";
			}
		}, function() {
			document.getElementById("penalty-report-message").innerHTML = "パスワードが正しくありません。";
		});
	}
}