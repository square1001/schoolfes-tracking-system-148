// ---------- VALID PLACE ARRAY ---------- //
var valid_place = [
	"1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
	"H1-1", "H1-2", "H1-3", "H1-4", "H1-5", "H1-6", "H1-7", "H1-8",
	"H2-1", "H2-2", "H2-3", "H2-4", "H2-5", "H2-6", "H2-7", "H2-8",
	"H3-1", "H3-2", "H3-3", "H3-4", "H3-5", "H3-6", "H3-7", "H3-8",
	"予備教室2", "予備教室3", "予備教室4", "その他"
];
var valid_place_sep = [ 0, 10, 18, 26, 34, 38 ]; // Separating-Row Index of valid place representing as table

// ---------- Convenient Functions ---------- //
function fillzero(str, num) {
	// Fill string str with leading zeros.
	while(str.length < num) {
		str = "0" + str;
	}
	return str;
}
function get_date_string(dt) {
	var res = "";
	res += dt.getFullYear();
	res += "-";
	res += fillzero(String(dt.getMonth() + 1), 2);
	res += "-";
	res += fillzero(String(dt.getDate()), 2);
	return res;
}
function get_time_string(dt) {
	var res = "";
	res += dt.getFullYear();
	res += "/";
	res += dt.getMonth() + 1;
	res += "/";
	res += dt.getDate();
	res += " ";
	res += dt.getHours();
	res += ":";
	res += fillzero(String(dt.getMinutes()), 2);
	res += ":";
	res += fillzero(String(dt.getSeconds()), 2);
	return res;
}
function is_number(str) {
	if(str == "") return true;
	if(/^\+?(0|[1-9]\d*)$/.test(str)) return true;
	return false;
}
function is_valid_date(year, month, date) {
	if(year < 1 || 9999 < year) return false;
	if(month < 1 || 12 < month) return false;
	var limit = 31;
	if(month == 2) {
		limit = 28;
		if(year % 400 == 0 || (year % 4 == 0 && year % 100 != 0)) {
			limit = 29;
		}
	}
	else if(month == 4 || month == 6 || month == 9 || month == 11) {
		limit = 30;
	}
	if(date < 1 || limit < date) return false;
	return true;
}
function merge_string(arr, merger) {
	var ans = "";
	for(var i = 0; i < arr.length; ++i) {
		if(i >= 1) ans += merger + " ";
		ans += arr[i];
	}
	return ans;
}
function split_string(str, splitter) {
	var ans = [];
	var pre = 0;
	for(var i = 0; i < str.length; ++i) {
		if(str[i] == splitter) {
			ans.push(str.substring(pre, i));
			pre = i + 1;
		}
	}
	if(pre != str.length) {
		ans.push(str.substring(pre, str.length));
	}
	for(var i = 0; i < ans.length; ++i) {
		while(ans[i].length > 0 && ans[i][0] == ' ') ans[i] = ans[i].substring(1);
		while(ans[i].length > 0 && ans[i][ans[i].length - 1] == ' ') ans[i] = ans[i].substring(0, ans[i].length - 1);
	}
	return ans;
}

// ---------- Retrieve Cookie Informations ---------- //
function get_editor_id() {
	var pos = document.cookie.indexOf("login-id=");
	if(pos == -1) return "";
	return document.cookie.substring(pos + 9, pos + 13); // get "xxxx" from "login-id=xxxx"
}
function get_status() {
	var pos = document.cookie.indexOf("status=");
	if(pos == -1) return "";
	if(document.cookie.substring(pos + 7, pos + 11) == "normal") return "normal";
	if(document.cookie.substring(pos + 7, pos + 16) == "executive") return "executive";
	if(document.cookie.substring(pos + 7, pos + 12) == "admin") return "admin";
	return "";
}

// ---------- Name Management ---------- //
function check_name(student_id, student_name) {
	return new Promise(function(resolve, reject) {
		var namesref = firebase.database().ref().child("names/student-" + student_id);
		namesref.once("value", function(snapshot) {
			if(!snapshot.exists()) reject();
			var matched = (snapshot.child("name-katakana").val() == student_name);
			if(matched) resolve();
			else reject();
		});
	});
}

// ---------- Password Management ---------- //
function string_hash(str) {
	var mod1 = 1000000007, mul1 = 311, val1 = 0;
	var mod2 = 1000000009, mul2 = 997, val2 = 0;
	var mod3 = 1000000021, mul3 = 773, val3 = 0;
	for(var i = 0; i < str.length; ++i) {
		val1 = (val1 * mul1 + str.charCodeAt(i)) % mod1;
		val2 = (val2 * mul2 + str.charCodeAt(i)) % mod2;
		val3 = (val3 * mul3 + str.charCodeAt(i)) % mod3;
	}
	var res = String(val1) + "," + String(val2) + "," + String(val3);
	return res;
}
function change_password(status, str, callback) {
	var passref = firebase.database().ref("password");
	passref.child("/" + status).set(string_hash(str)).then(callback);
}
function check_password(str) {
	return new Promise(function(resolve, reject) {
		str = string_hash(str);
		var passref = firebase.database().ref("password");
		passref.once("value", function(snapshot) {
			var status = "";
			if(snapshot.child("/normal").val() == str) status = "normal";
			if(snapshot.child("/executive").val() == str) status = "executive";
			if(snapshot.child("/admin").val() == str) status = "admin";
			if(status != "") resolve(status);
			else reject();
		});
	});
}