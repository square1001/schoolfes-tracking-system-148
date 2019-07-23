function get_accident_records() {
	var accidentref = firebase.database().ref("accidents");
	var simpleinforef = firebase.database().ref("sandan-info-simple");
	document.getElementById("accident-record-message").innerHTML = "データを取得中です・・・";
	accidentref.once("value", function(snapshot) {
		simpleinforef.once("value", function(snapshot_info) {
			var content = "";
			content += "<tr>";
			content += "<th colspan=\"2\">参団名</th>";
			content += "<th>#</th>";
			content += "<th>入力時刻</th>";
			content += "<th width=\"400\">事故内容</th>";
			content += "</th>";
			snapshot.forEach(accidents => {
				var sandan_id = accidents.key.substring(7); // take "xx" from "sandan-xx"
				var sandan_name = snapshot_info.child("sandan-" + sandan_id).val();
				var subcontent = "";
				var cnt = 0;
				accidents.forEach(i => {
					var request_id = parseInt(i.key.substring(8)); // take "xxxxxx" from "request-xxxxxx"
					var dt = new Date(i.child("time").val());
					subcontent += "<tr>";
					if(cnt == 0) {
						subcontent += "<td rowspan=\"" + accidents.numChildren() + "\">" + sandan_id + "</td>";
						subcontent += "<td rowspan=\"" + accidents.numChildren() + "\">" + sandan_name + "</td>";
					}
					subcontent += "<td>" + request_id + "</td>";
					subcontent += "<td>" + get_time_string(dt) + "</td>";
					subcontent += "<td>" + i.child("content").val() + "</td>";
					subcontent += "</tr>";
				});
				content += subcontent;
			});
			document.getElementById("accident-record-table").innerHTML = content;
			document.getElementById("accident-record-message").innerHTML = "データが正常に取得できました！";
		});
	});
}
var penalty_dict = {};
function get_penalty_records() {
	var penaltyref = firebase.database().ref("penalties");
	var simpleinforef = firebase.database().ref("sandan-info-simple");
	document.getElementById("penalty-record-message").innerHTML = "データを取得中です・・・";
	penaltyref.once("value", function(snapshot) {
		simpleinforef.once("value", function(snapshot_info) {
			var content = "";
			content += "<tr>";
			content += "<th width=\"225\" colspan=\"2\">参団名</th>";
			content += "<th>#</th>";
			content += "<th>入力時刻</th>";
			content += "<th width=\"250\">ペナルティー内容</th>";
			content += "<th width=\"250\">理由</th>"
			content += "<th>状況</th>"
			content += "</th>";
			snapshot.forEach(penalties => {
				var sandan_id = penalties.key.substring(7); // take "xx" from "sandan-xx"
				var sandan_name = snapshot_info.child("sandan-" + sandan_id).val();
				var subcontent = "";
				var cnt = 0;
				penalties.forEach(i => {
					var request_id = parseInt(i.key.substring(8)); // take "xxxxxx" from "request-xxxxxx"
					var dt = new Date(i.child("time").val());
					subcontent += "<tr>";
					if(cnt == 0) {
						subcontent += "<td rowspan=\"" + penalties.numChildren() + "\">" + sandan_id + "</td>";
						subcontent += "<td rowspan=\"" + penalties.numChildren() + "\">" + sandan_name + "</td>";
					}
					subcontent += "<td>" + request_id + "</td>";
					subcontent += "<td>" + get_time_string(dt) + "</td>";
					subcontent += "<td>" + i.child("penalty").val() + "</td>";
					subcontent += "<td>" + i.child("reason").val() + "</td>";
					subcontent += "<td>" + (i.child("completed").val() ? "〇" : "✖") + "</td>";
					subcontent += "</tr>";
					penalty_dict[request_id] = { completed: i.child("completed").val(), sandan_id: sandan_id };
				});
				content += subcontent;
			});
			document.getElementById("penalty-record-table").innerHTML = content;
			document.getElementById("penalty-record-message").innerHTML = "データが正常に取得できました！";
			if(get_status() == "executive" || get_status() == "admin") {
				document.getElementById("penalty-change-form").style = "display: block";
			}
		});
	});
}
function change_penalty_completeness() {
	var change_type_object = document.getElementById("change-type");
	var change_type = change_type_object.options[change_type_object.selectedIndex].value;
	var reqarr = split_string(document.getElementById("change-penalties").value, ',');
	var password = document.getElementById("password-input").value;
	for(var i = 0; i < reqarr.length; ++i) {
		reqarr[i] = parseInt(reqarr[i]);
	}
	var fail_req1 = [], fail_req2 = [];
	for(var i = 0; i < reqarr.length; ++i) {
		if(penalty_dict[reqarr[i]] == undefined) {
			fail_req1.push(reqarr[i]);
		}
		else if(penalty_dict[reqarr[i]].completed != (change_type == "complete" ? false : true)) {
			fail_req2.push(reqarr[i]);
		}
	}
	if(fail_req1.length > 0) {
		document.getElementById("penalty-change-message").innerHTML = "リクエスト #" + merge_string(fail_req1, ',') + " は存在しないか、ペナルティーのリクエストではありません。";
	}
	else if(fail_req2.length > 0) {
		document.getElementById("penalty-change-message").innerHTML = "リクエスト #" + merge_string(fail_req2, ',') + " は" + (change_type == "complete" ? "既に完了しています" : "完了していません") + "。";
	}
	else {
		check_password(password).then(function(status) {
			if(status == "executive" || status == "admin") {
				for(var i = 0; i < reqarr.length; ++i) {
					var ref = firebase.database().ref("penalties");
					ref = ref.child("sandan-" + penalty_dict[reqarr[i]].sandan_id);
					ref = ref.child("request-" + fillzero(String(reqarr[i]), 6));
					ref = ref.child("completed");
					ref.set((change_type == "complete" ? true : false));
				}
				document.getElementById("penalty-change-message").innerHTML = "リクエスト #" + merge_string(reqarr, ",") + "の完了状況が更新されました！" + (change_type == "complete" ? "✖ ➡ 〇" : "〇 ➡ ✖");
				get_penalty_records();
			}
			else {
				document.getElementById("penalty-change-message").innerHTML = "総務用または管理者のパスワードを入力してください。";
			}
		}, function() {
			document.getElementById("penalty-change-message").innerHTML = "パスワードが正しくありません。";
		});
	}
}