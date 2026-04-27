// app.js

// DOM元素
const startRecognitionBtn = document.getElementById('startRecognitionBtn');
const translateBtn = document.getElementById('translateBtn');
const speakBtn = document.getElementById('speakBtn');
const clearBtn = document.getElementById('clearBtn');
const swapLanguagesBtn = document.getElementById('swapLanguages');
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const sourceLanguage = document.getElementById('sourceLanguage');
const targetLanguage = document.getElementById('targetLanguage');
const recordingIndicator = document.getElementById('recordingIndicator');
const statusMessage = document.getElementById('statusMessage');

// 初始化语音识别对象
let recognition;
let isRecording = false;

// 检查浏览器是否支持语音识别
function initSpeechRecognition() {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = sourceLanguage.value;

        recognition.onstart = () => {
            isRecording = true;
            recordingIndicator.classList.add('active');
            statusMessage.textContent = "正在录音中，请说话...";
            startRecognitionBtn.innerHTML = '<i class="fas fa-stop"></i> 停止录音';
        };

        recognition.onend = () => {
            isRecording = false;
            recordingIndicator.classList.remove('active');
            startRecognitionBtn.innerHTML = '<i class="fas fa-microphone"></i> 语音输入';
        };

        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            inputText.value = transcript;
            statusMessage.textContent = "识别成功，正在翻译...";

            // 自动翻译
            await translateText();

            // 自动播放翻译结果
            speakTranslation();
        };

        recognition.onerror = (event) => {
            isRecording = false;
            recordingIndicator.classList.remove('active');
            startRecognitionBtn.innerHTML = '<i class="fas fa-microphone"></i> 语音输入';

            if (event.error === 'not-allowed') {
                statusMessage.textContent = "无法访问麦克风，请检查权限设置";
            } else if (event.error === 'no-speech') {
                statusMessage.textContent = "未检测到语音，请重试";
            } else {
                statusMessage.textContent = `识别错误: ${event.error}`;
            }
        };
    } else {
        statusMessage.textContent = "您的浏览器不支持语音识别功能";
        startRecognitionBtn.disabled = true;
    }
}

// 初始化语音识别
initSpeechRecognition();

// 语音输入按钮点击事件
startRecognitionBtn.addEventListener('click', () => {
    if (!recognition) return;

    if (isRecording) {
        recognition.stop();
    } else {
        recognition.lang = sourceLanguage.value;
        recognition.start();
    }
});

// 翻译按钮点击事件
translateBtn.addEventListener('click', translateText);

// 播放翻译结果按钮点击事件
speakBtn.addEventListener('click', speakTranslation);

// 清空按钮点击事件
clearBtn.addEventListener('click', () => {
    inputText.value = '';
    outputText.value = '';
    statusMessage.textContent = "已清空，请输入文本或使用语音输入";
});

// 交换语言按钮点击事件
swapLanguagesBtn.addEventListener('click', () => {
    const temp = sourceLanguage.value;
    sourceLanguage.value = targetLanguage.value;
    targetLanguage.value = temp;

    // 如果有输入和输出，交换它们
    const tempText = inputText.value;
    inputText.value = outputText.value;
    outputText.value = tempText;

    statusMessage.textContent = "已交换语言";
});

// 语言选择变化事件
sourceLanguage.addEventListener('change', () => {
    if (recognition) {
        recognition.lang = sourceLanguage.value;
    }
    statusMessage.textContent = "源语言已更改";
});

targetLanguage.addEventListener('change', () => {
    statusMessage.textContent = "目标语言已更改";
});

// 翻译函数
async function translateText() {
    const text = inputText.value.trim();
    if (!text) {
        statusMessage.textContent = "请输入要翻译的文本";
        return;
    }

    statusMessage.textContent = "正在翻译...";

    try {
        // 这里使用MyMemory Translation API进行翻译
        const sourceLang = sourceLanguage.value.split('-')[0];
        const targetLang = targetLanguage.value.split('-')[0];

        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`);
        const data = await response.json();

        if (data.responseStatus === 200) {
            outputText.value = data.responseData.translatedText;
            statusMessage.textContent = "翻译完成";
        } else {
            throw new Error(data.responseDetails || "翻译失败");
        }
    } catch (error) {
        console.error("翻译错误:", error);
        outputText.value = "翻译失败，请稍后重试";
        statusMessage.textContent = "翻译服务暂时不可用";
    }
}

// 语音合成函数
function speakTranslation() {
    const text = outputText.value.trim();
    if (!text) {
        statusMessage.textContent = "没有可播放的翻译结果";
        return;
    }

    // 取消当前正在播放的语音
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLanguage.value;
    utterance.rate = 1; // 语速
    utterance.pitch = 1; // 音调

    utterance.onstart = () => {
        statusMessage.textContent = "正在播放翻译结果...";
        speakBtn.innerHTML = '<i class="fas fa-pause"></i> 停止播放';
    };

    utterance.onend = () => {
        statusMessage.textContent = "播放完成";
        speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> 播放翻译';
    };

    utterance.onerror = (event) => {
        console.error("语音合成错误:", event.error);
        statusMessage.textContent = "播放失败，请重试";
        speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> 播放翻译';
    };

    speechSynthesis.speak(utterance);
}

// 页面加载完成后的初始化
window.addEventListener('DOMContentLoaded', () => {
    statusMessage.textContent = "准备就绪，请选择语言并开始翻译";

    // 检查浏览器是否支持语音合成
    if (!'speechSynthesis' in window) {
        statusMessage.textContent = "您的浏览器不支持语音合成功能";
        speakBtn.disabled = true;
    }
});
