function saveDiary() {
  const text = document.getElementById("diary").value;
  if (!text) return alert("何か書いてね！");
  
  const list = document.getElementById("list");
  const item = document.createElement("li");
  item.textContent = text;
  list.appendChild(item);

  document.getElementById("diary").value = ""; // 入力欄をリセット
}
