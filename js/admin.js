function addname() {
	document.getElementById("addname-verdict").innerHTML = "データを送信中です・・・";
	var dbref = firebase.database().ref();
	var student_id = document.getElementById("student-id").value;
	var student_name_kanji = document.getElementById("student-name-kanji").value;
	var student_name_katakana = document.getElementById("student-name-katakana").value;
	var nameref = dbref.child("names");
	var updates = {};
	updates["/student-" + student_id + "/name-kanji"] = student_name_kanji;
	updates["/student-" + student_id + "/name-katakana"] = student_name_katakana;
	nameref.update(updates).then(function() {
		document.getElementById("addname-verdict").innerHTML = "名前が正常に追加されました！";
	});
}
function sandan_input() {
	document.getElementById("sandan-input-verdict").innerHTML = "データを送信中です・・・";
	var sandan_id = document.getElementById("sandan-id").value;
	var sandan_name = document.getElementById("sandan-name").value;
	var chief_id = document.getElementById("chief-id").value;
	var subchief_id = document.getElementById("subchief-id").value;
	var supervisor_id = document.getElementById("supervisor-id").value;
	var contact = document.getElementById("contact").value;
	var inforef = firebase.database().ref().child("sandan-info").child("sandan-" + sandan_id);
	var simpleinforef = firebase.database().ref().child("sandan-info-simple").child("sandan-" + sandan_id);
	var namesref = firebase.database().ref().child("names");
	namesref.child("student-" + chief_id).once("value", function(snapshot_chief) {
		namesref.child("student-" + subchief_id).once("value", function(snapshot_subchief) {
			namesref.child("student-" + supervisor_id).once("value", function(snapshot_supervisor) {
				simpleinforef.set(sandan_name);
				var updates = {};
				updates["/sandan-name"] = sandan_name;
				updates["/chief-id"] = (chief_id != "" ? chief_id : null);
				updates["/chief-name"] = (chief_id != "" ? snapshot_chief.child("name-kanji").val() : null);
				updates["/subchief-id"] = (subchief_id != "" ? subchief_id : null);
				updates["/subchief-name"] = (subchief_id != "" ? snapshot_subchief.child("name-kanji").val() : null);
				updates["/supervisor-id"] = (supervisor_id != "" ? supervisor_id : null);
				updates["/supervisor-name"] = (supervisor_id != "" ? snapshot_supervisor.child("name-kanji").val() : null);
				updates["/contact"] = (contact != "" ? contact : null);
				inforef.update(updates).then(function() {
					document.getElementById("sandan-input-verdict").innerHTML = "正常にデータが更新されました！";
				});
			});
		});
	});
}
function change_password_front() {
	document.getElementById("change-password-verdict").innerHTML = "パスワードを変更中です・・・";
	var status_object = document.getElementById("password-type");
	var status = status_object.options[status_object.selectedIndex].value;
	var new_password = document.getElementById("new-password").value;
	if(new_password == "") {
		document.getElementById("change-password-verdict").innerHTML = "空のパスワードは使用できません。";
	}
	else {
		change_password(status, new_password, function() {
			document.getElementById("change-password-verdict").innerHTML = "パスワードが正常に更新されました！";
		});
	}
}