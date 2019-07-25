// ---------- SANDAN ACTIVITY REPORT SUBMISSION ---------- //
var place_options = "<option value=\"none\">選択してください</option>";
for(var i = 0; i < valid_place.length; ++i) {
	place_options += "<option value=\"" + fillzero(String(i), 2) + "\">";
	place_options += fillzero(String(i), 2) + " - " + valid_place[i];
	place_options += "</option>";
}
document.getElementById("activity-report-place").innerHTML = place_options;
var student_name = "";
function activity_report_id_change() {
	var send_message = function(message_type, val) {
		var content = "";
		if(message_type == 1) content = "Loading...";
		if(message_type == 0) content = val;
		if(message_type == -1) content = "?";
		if(message_type == -2) content = "";
		student_name = val;
		document.getElementById("activity-report-student-name").innerHTML = content;
	}
	send_message(1, "");
	student_name = "";
	var id_str = document.getElementById("activity-report-student-id").value;
	if(id_str == "") {
		send_message(-2, "");
	}
	else if(!is_number(id_str) || id_str.length != 4) {
		send_message(-1, "");
	}
	else {
		var namesref = firebase.database().ref("names/student-" + id_str);
		namesref.once("value", function(snapsnot) {
			var name_kanji = snapsnot.child("name-kanji").val();
			if(name_kanji == null) {
				send_message(-1, "");
			}
			else {
				send_message(0, name_kanji);
			}
		});
	}
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
var activity_waiting_response = false;
function report_activity() {
	// ---------- Getting Variables ---------- //
	var type_object = document.getElementById("activity-report-type");
	var type = type_object.options[type_object.selectedIndex].value;
	var place_object = document.getElementById("activity-report-place");
	var place_id = place_object.options[place_object.selectedIndex].value;
	var place = (place_id != "none" ? valid_place[parseInt(place_id)] : "");
	var student_id = document.getElementById("activity-report-student-id").value;
	var sandan_object = document.getElementById("sandan-option");
	var sandan_id = sandan_object.options[sandan_object.selectedIndex].value.substring(7); // takes "xx" from "sandan-xx"
	var requestsref = firebase.database().ref("requests");
	var activitiesref = firebase.database().ref("activities/sandan-" + sandan_id);
	var room_id = valid_place.indexOf(place);
	var room_id_str = String(room_id);
	while(room_id_str.length < 2) room_id_str = "0" + room_id_str;
	var roomstateref = firebase.database().ref("room-state/room-" + room_id_str);
	var sandaninforef = firebase.database().ref("sandan-info/sandan-" + sandan_id);
	var penaltyref = firebase.database().ref("penalties/sandan-" + sandan_id);
	var editor_id = get_editor_id();
	var nameresref = firebase.database().ref("names/student-" + student_id);
	var nameediref = firebase.database().ref("names/student-" + editor_id);
	var change_verdict_activity = function(res) {
		var message;
		if(res == -1) {
			message = "ログアウトされています。";
		}
		if(res == -2) {
			message = "活動場所が選択されていません。";
		}
		if(res == -3) {
			message = "活動責任者の 4 桁番号がありえないものになっています。";
		}
		if(res == -4) {
			message = "開始しているのに開始報告を出している、あるいは終了しているのに終了報告を出しています。";
		}
		if(res == -5) {
			message = "活動可能区分が「✖」になっています。";
		}
		if(res == -6) {
			message = "ペナルティーが完了していない状況で、開始報告を出そうとしています。";
		}
		if(res == -7) {
			message = "資材が返されていないのに終了報告を出そうとしています。";
		}
		if(res == 2) {
			message = "データを送信中です・・・";
		}
		if(res == 1) {
			message = "同じリクエストについて同時に 2 回「提出」ボタンを押したので、そのうち片方が受理されます。";
		}
		if(res == 0) {
			document.getElementById("activity-report-place").selectedIndex = "0";
			document.getElementById("activity-report-student-id").value = "";
			document.getElementById("activity-report-student-name").value = "";
			activity_report_id_change();
			message = "入力に成功しました！"
		}
		if(res != 1) activity_waiting_response = false;
		document.getElementById("activity-report-message").innerHTML = message;
	}
	var update_room_state = function(current_used) {
		roomstateref.child("current-used").set(current_used);
		firebase.database().ref("room-state/last-update").set((new Date()).getTime());
	};
	var send_data = function() {
		roomstateref.once("value", function(snapshot_room) {
			sandaninforef.once("value", function(snapshot_info) {
				penaltyref.once("value", function(snapshot_penalty) {
					var using_room_arr = snapshot_info.child("using-room").val();
					var material_arr = snapshot_info.child("materials").val();
					var availability = snapshot_room.child("availability").val();
					var current_used = snapshot_room.child("current-used").val();
					if(availability == null) availability = true;
					if(current_used == null) current_used = [];
					if(using_room_arr == null) using_room_arr = [];
					if(material_arr == null) material_arr = new Array(material_name.length).fill(0);
					var penalty_complete = true;
					snapshot_penalty.forEach(i => {
						if(!i.child("completed").val()) {
							penalty_complete = false;
						}
					});
					if(availability && (type == "finish" || penalty_complete) && (type == "start" || using_room_arr.length >= 2 || Math.max.apply(null, material_arr) == 0)) {
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
											using_room_arr.push(room_id);
											update_active_day(sandan_id);
										}
										if(type == "finish") {
											current_used.splice(current_used.indexOf(sandan_id), 1);
											using_room_arr.splice(using_room_arr.indexOf(room_id), 1);
										}
										activitiesref.child("request-" + nxtkeystr).update(updates);
										updates["/sandan-id"] = sandan_id;
										requestsref.child(get_date_string(new Date())).child("request-" + nxtkeystr).update(updates);
										update_room_state(current_used);
										sandaninforef.child("using-room").set(using_room_arr).then(function() {
											change_verdict_activity(0);
										});
									});
								});
							});
						}
						else {
							change_verdict_activity(-4);
						}
					}
					else if(!availability) {
						change_verdict_activity(-5);
					}
					else if(type == "start" && !penalty_complete) {
						change_verdict_activity(-6);
					}
					else {
						change_verdict_activity(-7);
					}
				});
			});
		});
	}
	
	// ---------- Error Judgement ---------- //
	change_verdict_activity(2);
	if(activity_waiting_response) {
		change_verdict_activity(1);
		return;
	}
	waiting_response = true;
	if(document.cookie.indexOf("login-id=") == -1) {
		// when NOT LOGGED IN
		change_verdict_activity(-1);
		return;
	}
	if(place_id == "none") {
		// when PLACE IS INVALID
		change_verdict_activity(-2);
		return;
	}
	if(student_name != "") {
		send_data();
	}
	else {
		change_verdict_activity(-3); // when NOT-MATCHED
	};
}

// ---------- About Material ---------- //
function material_type_change() {
	var material_type_object = document.getElementById("material-type");
	var material_type = material_type_object.options[material_type_object.selectedIndex].value;
	if(material_type == "none") {
		document.getElementById("material-list").innerHTML = "";
		document.getElementById("material-button").style = "display: none";
	}
	else {
		var material_type_id = parseInt(material_type.substring(14)); // take "x" from "material-type-x"
		var content = "";
		content += "<table style=\"border: 0px\">";
		var cnt = 0;
		for(var i = material_sep[material_type_id - 1]; i < material_sep[material_type_id]; ++i) {
			if(cnt % 4 == 0) {
				if(cnt != 0) content += "</tr>";
				content += "<tr>";
			}
			++cnt;
			content += "<td>";
			content += material_name[i];
			content += " × ";
			content += "<input style=\"width: 40px\" id=\"material-" + fillzero(String(i), 2) + "\"></input>";
			content += "</td>";
		}
		content += "</tr>";
		content += "</table>";
		document.getElementById("material-list").innerHTML = content;
		document.getElementById("material-button").style = "display: block";
	}
}
function report_material() {
	var sandan_object = document.getElementById("sandan-option");
	var sandan_id = sandan_object.options[sandan_object.selectedIndex].value.substring(7); // takes "xx" from "sandan-xx"
	var material_direction_object = document.getElementById("material-direction");
	var material_direction = material_direction_object.options[material_direction_object.selectedIndex].value;
	var material_type_object = document.getElementById("material-type");
	var material_type = material_type_object.options[material_type_object.selectedIndex].value;
	var material_type_id = parseInt(material_type.substring(14)); // take "x" from "material-type-x"
	var materialref = firebase.database().ref("sandan-info/sandan-" + sandan_id + "/materials");
	var usingroomref = firebase.database().ref("sandan-info/sandan-" + sandan_id + "/using-room");
	var inc = new Array(material_name.length).fill(0);
	var failure = 0;
	for(var i = material_sep[material_type_id - 1]; i < material_sep[material_type_id]; ++i) {
		var numstr = document.getElementById("material-" + fillzero(String(i), 2)).value;
		if(numstr != "" && (!is_number(numstr) || numstr == "0")) {
			failure = Math.min(failure, -4);
		}
		else if(numstr != "") {
			inc[i] = parseInt(numstr);
			if(material_direction == "return") inc[i] *= -1;
		}
	}
	if(Math.max.apply(null, inc) == 0 && Math.min.apply(null, inc) == 0) {
		failure = Math.min(failure, -3);
	}
	var send_message = function() {
		if(failure == -4) {
			document.getElementById("material-report-message").innerHTML = "各入力場所には空白か正の整数を入力してください。";
		}
		if(failure == -3) {
			document.getElementById("material-report-message").innerHTML = "何も入力されていません。";
		}
		if(failure == -2) {
			document.getElementById("material-report-message").innerHTML = "活動開始報告を出していない参団は、資材を借りることができません。";
		}
		if(failure == -1) {
			document.getElementById("material-report-message").innerHTML = "借りた個数以上の資材を返そうとしています。";
		}
		if(failure == 0) {
			document.getElementById("material-report-message").innerHTML = "資材を" + (material_direction == "borrow" ? "借りる" : "返す") + "ことに成功しました！";
		}
	};
	var send_data = function() {
		usingroomref.once("value", function(snapshot_room) {
			var using_room = snapshot_room.val();
			if(using_room == null) using_room = [];
			if(using_room.length >= 1) {
				// this sandan is currently active
				materialref.once("value", function(snapshot) {
					var arr = snapshot.val();
					if(arr == null) arr = new Array(material_name.length).fill(0);
					var nxtarr = arr;
					for(var i = material_sep[material_type_id - 1]; i < material_sep[material_type_id]; ++i) {
						nxtarr[i] += inc[i];
					}
					if(Math.min.apply(null, nxtarr) < 0) {
						failure = Math.min(failure, -1);
						send_message(failure);
					}
					else {
						materialref.set(nxtarr);
						send_message(failure);
						for(var i = material_sep[material_type_id - 1]; i < material_sep[material_type_id]; ++i) {
							document.getElementById("material-" + fillzero(String(i), 2)).value = "";
						}
					}
				});
			}
			else {
				// this sandan is currently inactive
				failure = Math.min(failure, -2);
				send_message(failure);
			}
		});
	};
	if(failure < 0) send_message(failure);
	else send_data();
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
	var send_data = function() {
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
				document.getElementById("accident-report-message").innerHTML = "データが正常に入力されました！";
			});
		});
	};
	document.getElementById("accident-report-message").innerHTML = "データを入力しています・・・";
	if(content.length < 10) {
		document.getElementById("accident-report-message").innerHTML = "事故内容は 10 文字以上でなければなりません。";
	}
	else {
		send_data();
	}
}

// ---------- Get Progress ---------- //
function get_progress() {
	var sandan_object = document.getElementById("sandan-option");
	var sandan_id = sandan_object.options[sandan_object.selectedIndex].value.substring(7); // takes "xx" from "sandan-xx"
	var inforef = firebase.database().ref("sandan-info/sandan-" + sandan_id);
	inforef.once("value", function(snapshot) {
		var progress = snapshot.child("progress").val();
		if(progress == null) progress = [ 0, 0, 0, 0 ];
		document.getElementById("progress-type-1-label").innerHTML = "パネル作業 (現在：" + progress[0] + " %)";
		document.getElementById("progress-type-2-label").innerHTML = "特殊組木作業 (現在：" + progress[1] + " %)";
		document.getElementById("progress-type-3-label").innerHTML = "輪転作業 (現在：" + progress[2] + " %)";
		document.getElementById("progress-type-4-label").innerHTML = "その他屋内作業 (現在：" + progress[3] + " %)";
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
					get_progress();
				});
			});
		});
	}
	document.getElementById("progress-report-message").innerHTML = "データを入力しています・・・";
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
				document.getElementById("penalty-report-message").innerHTML = "正常に更新されました。";
				document.getElementById("penalty").value = "";
				document.getElementById("penalty-reason").value = "";
				document.getElementById("password-input").value = "";
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