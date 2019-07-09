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
			var password = document.getElementById("password-input").value;
			var validuserref = firebase.database().ref("valid-user-id");
			validuserref.once("value", function(snapshot_user) {
				if(snapshot_user.val().indexOf(user.uid) == -1) {
					firebase.auth().signOut();
				}
				else {
					check_name(student_id, student_name).then(function() {
						// Valid Student ID and Name
						check_password(password).then(function(status) {
							// Valid Password
							var dt = new Date();
							dt.setTime(dt.getTime() + 86400 * 1000);
							document.cookie = "login-id=" + student_id + "; expires=" + dt.toUTCString() + "; path=/";
							document.cookie = "status=" + status + "; expires=" + dt.toUTCString() + "; path=/";
							window.location.href = "index.html";
							return true;
						}, function() {
							// Invalid Password
							document.getElementById("login-verdict").innerHTML = "パスワードが正しくありません。";
							return false;
						});
					}, function() {
						// Invalid Student ID and Name
						document.getElementById("login-verdict").innerHTML = "4 桁番号と名前が一致していません。"
						return false;
					});
				}
			});
		}
	});
}