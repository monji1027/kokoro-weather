// ===== 日記を保存 =====
function saveDiary() {
  const text = document.getElementById("diary").value;
  if (!text) {
    alert("何か書いてね！");
    return;
  }

  const emotionInput = document.querySelector('input[name="emotion"]:checked');
  if (!emotionInput) {
    alert("感情をひとつ選んでね！");
    return;
  }

  const emotion = emotionInput.value;
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  const entry = { date: dateStr, emotion: emotion, text: text };

  const saved = JSON.parse(localStorage.getItem("diaryList") || "[]");
  saved.push(entry);
  localStorage.setItem("diaryList", JSON.stringify(saved));

  // 最新の配列でリストを描き直す
  renderList(saved);

  document.getElementById("diary").value = "";
  emotionInput.checked = false;
}

// ===== ページ読み込み時に保存データを表示 =====
window.onload = function () {
  const saved = JSON.parse(localStorage.getItem("diaryList") || "[]");
  renderList(saved);
};

// ===== 配列からリストを描き直す =====
function renderList(entries) {
  const list = document.getElementById("list");
  list.innerHTML = ""; // 一旦全部消す

  entries.forEach((entry, index) => {
    addToList(entry, index);
  });
}

// ===== 感情ごとにクラス名を返す関数 =====
function getEmotionClass(emotion) {
  switch (emotion) {
    case "喜び":
      return "emotion-joy";
    case "悲しみ":
      return "emotion-sad";
    case "怒り":
      return "emotion-anger";
    case "恐れ":
      return "emotion-fear";
    case "嫌悪":
      return "emotion-disgust";
    case "驚き":
      return "emotion-surprise";
    default:
      return "emotion-default";
  }
}

// ===== リストに1件追加する関数 =====
function addToList(entry, index) {
  const list = document.getElementById("list");
  const item = document.createElement("li");
  item.classList.add("diary-item");
  item.classList.add(getEmotionClass(entry.emotion));

  // テキスト部分
  const textSpan = document.createElement("span");
  textSpan.textContent = `[${entry.date}][${entry.emotion}] ${entry.text}`;

  // 削除ボタン
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "×";
  deleteBtn.classList.add("delete-btn");
  deleteBtn.onclick = function () {
    deleteEntry(index);
  };

  item.appendChild(textSpan);
  item.appendChild(deleteBtn);
  list.appendChild(item);
}

// ===== 指定した番号の日記を削除 =====
function deleteEntry(index) {
  const saved = JSON.parse(localStorage.getItem("diaryList") || "[]");

  // index 番目を削除
  saved.splice(index, 1);

  // 保存しなおして、リストを描き直す
  localStorage.setItem("diaryList", JSON.stringify(saved));
  renderList(saved);
}

// ===== AIで感情を自動判定してラジオボタンに反映 =====
async function autoSelectEmotion() {
  const text = document.getElementById("diary").value;
  if (!text) {
    alert("まず日記を書いてね！");
    return;
  }

  try {
    const response = await fetch("/api/classifyEmotion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: text }),
    });

    const data = await response.json();
    if (data.error) {
      console.error("Emotion API error:", data.error);
      alert("感情判定でエラーが起きました。時間をおいて試してください。");
      return;
    }

    // OpenAIからの result は JSON文字列（{"喜び":0.8,...}）を想定
    const scores = JSON.parse(data.result);

    const emotions = ["恐れ", "怒り", "喜び", "悲しみ", "嫌悪", "驚き"];
    let best = emotions[0];
    let bestScore = scores[best] ?? 0;

    for (const e of emotions) {
      const val = scores[e] ?? 0;
      if (val > bestScore) {
        best = e;
        bestScore = val;
      }
    }

    // ラジオボタンに反映
    const radio = document.querySelector(
      `input[name="emotion"][value="${best}"]`
    );
    if (radio) {
      radio.checked = true;
      alert(`AIの推定結果：${best}（スコア ${bestScore.toFixed(2)}）を選びました`);
    } else {
      alert("感情の反映に失敗しました");
    }
  } catch (err) {
    console.error("autoSelectEmotion error:", err);
    alert("AIによる感情判定でエラーが起きました。");
  }
}
