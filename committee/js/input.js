// ---------- Availability Table Section ---------- //
function set_availability_table() {
	var dataref = firebase.database().ref("room-state");
	dataref.once("value", function(snapshot) {
		var content = "";
		for(var i = 0; i < valid_place_sep.length - 1; ++i) {
			content += "<tr>";
			for(var j = valid_place_sep[i]; j < valid_place_sep[i + 1]; ++j) {
				content += "<td width=\"78\">" + valid_place[j] + "</td>";
			}
			content += "</tr>";
			content += "<tr>";
			for(var j = valid_place_sep[i]; j < valid_place_sep[i + 1]; ++j) {
				var flag = snapshot.child("room-" + fillzero(String(j), 2) + "/availability").val();
				if(flag == null) flag = true;
				content += "<td width=\"78\">" + (flag ? "〇" : "✖") + "</td>";
			}
			content += "</tr>";
		}
		document.getElementById("availability-table").innerHTML = content;
	});
}
function start_editing_availability() {
	document.getElementById("availability-content").style.display = "block";
	set_availability_table();
}
function change_availability() {
	document.getElementById("availability-change-message").innerHTML = "データを更新中です・・・";
	var change_type_object = document.getElementById("change-type");
	var change_type = change_type_object.options[change_type_object.selectedIndex].value;
	var rooms = split_string(document.getElementById("change-rooms").value, ',');
	function set_message(state) {
		var message = "";
		if(state == -1) {
			for(var i = 0; i < failroom.length; ++i) {
				if(i != 0) message += ", ";
				message += "「" + failroom[i] + "」";
			}
			message += " という部屋名は存在しません。";
		}
		if(state == -2) {
			message = "同じ部屋が 2 回以上現れています。";
		}
		if(state == -3) {
			message += "活動可能区分が" + (change_type == "open" ? "「〇」" : "「✖」") + "なのに、";
			message += (change_type == "open" ? "「〇 ➡ ✖」" : "「✖ ➡ 〇」") + "としようとしている部屋があります。";
		}
		if(state == -4) {
			message += "使用している参団があるのに、活動可能区分を「✖」にしようとしています。";
		}
		if(state == 0) {
			message = "正常に活動可能区分が切り替わりました！";
		}
		document.getElementById("availability-change-message").innerHTML = message;
	}
	var failure = 0, failroom = [];
	for(var i = 0; i < rooms.length; ++i) {
		for(var j = 0; j < i; ++j) {
			if(rooms[i] == rooms[j]) {
				failure = -2;
			}
		}
	}
	for(var i = 0; i < rooms.length; ++i) {
		if(valid_place.indexOf(rooms[i]) == -1) {
			failure = -1;
			failroom.push(rooms[i]);
		}
	}
	if(failure != 0) {
		set_message(failure);
		return;
	}
	var stateref = firebase.database().ref("room-state");
	stateref.once("value", function(snapshot) {
		for(var i = 0; i < rooms.length; ++i) {
			var id = valid_place.indexOf(rooms[i]);
			var state = snapshot.child("/room-" + fillzero(String(id), 2) + "/availability").val();
			if(state == null) state = true;
			if((state && change_type == "open") || (!state && change_type == "close")) {
				failure = -3;
				break;
			}
			var current_used = snapshot.child("/room" + fillzero(String(id), 2) + "/current-used").val();
			if(current_used == null) current_used = [];
			if(change_type == "close" && current_used == []) {
				failure = -4;
			}
		}
		if(failure != 0) {
			set_message(failure);
			return;
		}
		else {
			var updates = {};
			for(var i = 0; i < rooms.length; ++i) {
				var id = valid_place.indexOf(rooms[i]);
				updates["/room-" + fillzero(String(id), 2) + "/availability"] = (change_type == "open" ? true : false);
			}
			stateref.update(updates).then(function() {
				set_message(0);
				set_availability_table();
			});
		}
	});
}

// ---------- Diary Section ---------- //
function report_diary() {
	document.getElementById("diary-report-message").innerHTML = "日誌を送信中です・・・";
	var status = get_status();
	if(status == "none") status = "normal";
	else if(status == "executive") status = "executive";
	else if(status == "admin") status = "executive";
	var content = document.getElementById("diary-content").value;
	if(content.length < 15) {
		document.getElementById("diary-report-message").innerHTML = "日誌は 15 文字以上でなければなりません。";
		return false;
	}
	var editor_id = get_editor_id();
	var diaryref = firebase.database().ref("committee/diaries");
	var nameediref = firebase.database().ref("names/student-" + editor_id);
	document.getElementById("diary-report-message").innerHTML = "日誌を送信中です・・・";
	nameediref.once("value", function(snapshot_edi) {
		diaryref.child("current-id").once("value", function(snapshot_id) {
			var nxtkey = snapshot_id.val();
			nxtkey = (nxtkey == null ? 1 : nxtkey + 1);
			var nxtkeystr = nxtkey.toString();
			while(nxtkeystr.length < 6) nxtkeystr = "0" + nxtkeystr;
			var updates = {};
			updates["/type"] = status;
			updates["/time"] = (new Date()).getTime();
			updates["/content"] = content;
			updates["/editor-id"] = editor_id;
			updates["/editor-name"] = snapshot_edi.child("name-kanji").val();
			diaryref.child("diary-" + nxtkeystr).update(updates);
			diaryref.child("current-id").set(nxtkey);
			document.getElementById("diary-content").value = "";
			document.getElementById("diary-report-message").innerHTML = "正常に日誌が送信されました！";
			return true;
		});
	});
}

// ---------- Attendance Section ---------- //
function change_attendance_number() {
	var rows = document.getElementById("attendance-table").rows.length;
	document.getElementById("current-attendance").innerHTML = rows - 1;
}
function add_row() {
	var new_row = document.createElement("tr");
	var content = "";
	content += "<td><a onclick=\"delete_row(this)\">✖</a></td>";
	content += "<td><input class=\"student-id\" style=\"width: 90px; text-align: center\" /></td>";
	content += "<td><input class=\"student-name\" style=\"width: 150px; text-align: center\" /></td>";
	new_row.innerHTML = content;
	document.getElementById("attendance-table").append(new_row);
	change_attendance_number();
}
function delete_row(t) {
	document.getElementById("attendance-table").removeChild(t.parentNode.parentNode);
	change_attendance_number();
}
function report_attendance() {
	document.getElementById("attendance-report-message").innerHTML = "出席確認データを送信中です・・・";
	var curyear = (new Date()).getFullYear();
	var curmonth = (new Date()).getMonth() + 1;
	var curdate = (new Date()).getDate();
	var today = curyear + "-" + (curmonth < 10 ? "0" : "") + curmonth + "-" + (curdate < 10 ? "0" : "") + curdate;
	var table = document.getElementById("attendance-table");
	var people = table.rows.length - 1;
	var attendance = [];
	for(var i = 0; i < people; ++i) {
		var student_id = table.rows[i + 1].getElementsByClassName("student-id")[0].value;
		var student_name = table.rows[i + 1].getElementsByClassName("student-name")[0].value;
		attendance.push({ id: student_id, name: student_name });
	}
	var fully_written = true;
	for(var i = 0; i < people; ++i) {
		if(attendance[i].id == "" || attendance[i].name == "") {
			fully_written = false;
		}
	}
	if(!fully_written) {
		document.getElementById("attendance-report-message").innerHTML = "書かれていない 4 桁番号または氏名のマスがあります。";
		return;
	}
	// ---------- Send Data Phase ---------- //
	var namesref = firebase.database().ref("names"); // heavy data load
	namesref.once("value", function(snapshot) {
		var mistake_rows = "";
		for(var i = 0; i < people; ++i) {
			var correct_name = snapshot.child("student-" + attendance[i].id + "/name-hiragana").val();
			if(attendance[i].name != correct_name) {
				if(mistake_rows != "") mistake_rows += ", ";
				mistake_rows += (i + 1);
			}
		}
		if(mistake_rows != "") {
			document.getElementById("attendance-report-message").innerHTML = mistake_rows + " 行目の 4 桁番号または氏名が正しくありません。";
			return;
		}
		else {
			for(var i = 0; i < people; ++i) {
				attendance[i].name = snapshot.child("student-" + attendance[i].id + "/name-kanji").val();
			}
			firebase.database().ref("committee/attendance/" + today).set(attendance).then(function() {
				while(document.getElementById("attendance-table").rows.length > 1) {
					document.getElementById("attendance-table").deleteRow(1);
				}
				change_attendance_number();
				document.getElementById("attendance-report-message").innerHTML = "出席確認が完了しました！";
			});
		}
	});
}
change_attendance_number();