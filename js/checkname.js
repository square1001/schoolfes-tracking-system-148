function name_match(student_id, student_name) {
	return new Promise(function(resolve, reject) {
		var namesref = firebase.database().ref().child("names");
		namesref.once("value", function(snapshot) {
			var matched = false;
			snapshot.forEach(i => {
				var iname = i.child("name-katakana");
				if(i.key == "student-" + student_id && iname.val() == student_name) {
					matched = true;
				}
			});
			if(matched) resolve();
			else reject();
		});
	});
}
function login_validation() {
	document.getElementById("login-verdict").innerHTML = "ログイン中です・・・";
	firebase.auth().onAuthStateChanged((user) => {
		if (!user) {
			document.getElementById("login-verdict").innerHTML = "アカウントの認証ができてないか、正しいアカウントで認証できていません。Google アカウントでサインインする場所がない場合は、画面を再読み込みしてください。";
			return false;
		}
		else {
			var student_id = document.getElementById("student-id").value;
			var student_name = document.getElementById("student-name").value;
			var student_password = document.getElementById("password-input").value;
			var passref = firebase.database().ref("password");
			var validuserref = firebase.database().ref("valid-user-id");
			validuserref.once("value", function(snapshot_user) {
				if(snapshot_user.val().indexOf(user.uid) == -1) {
					firebase.auth().signOut();
				}
				else {
					passref.once("value", function(snapshot) {
						name_match(student_id, student_name).then(function() {
							if(student_password != "" && student_password != snapshot.child("/executive").val() && student_password != snapshot.child("/admin").val()) {
								document.getElementById("login-verdict").innerHTML = "パスワードが正しくありません。";
								return false;
							}
							else {
								var status = "none";
								if(student_password == snapshot.child("/executive").val()) status = "executive";
								if(student_password == snapshot.child("/admin").val()) status = "admin";
								var dt = new Date();
								dt.setTime(dt.getTime() + 86400 * 1000);
								document.cookie = "login-id=" + student_id + "; expires=" + dt.toUTCString() + "; path=/";
								document.cookie = "status=" + status + "; expires=" + dt.toUTCString() + "; path=/";
								window.location.href = "index.html";
								return true;
							}
						}, function() {
							document.getElementById("login-verdict").innerHTML = "4 桁番号と名前が一致していません。"
							return false;
						});
					});
				}
			});
		}
	});
}