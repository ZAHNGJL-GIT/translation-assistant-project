// 全局变量
let recognition;
let isRecording = false;
const sourceLanguage = document.getElementById('sourceLanguage');
const targetLanguage = document.getElementById('targetLanguage');
const inputText = document.getElementById('inputText');
const outputText = document.getElementById('outputText');
const startRecognitionBtn = document.getElementById('startRecognitionBtn');
const translateBtn = document.getElementById('translateBtn');
const speakBtn = document.getElementById('speakBtn');
const clearBtn = document.getElementById('clearBtn');
const swapBtn = document.getElementById('swapBtn');
const statusMessage = document.getElementById('statusMessage');
const recordingIndicator = document.getElementById('recordingIndicator');

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initSpeechRecognition();
    initEventListeners();
    initializeVoices();
});

// VIVO 安卓手机专用语音识别（修复点击没反应）
function initSpeechRecognition() {
    try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("请使用 Chrome 浏览器，语音输入需要支持麦克风权限");
            return;
        }

        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = sourceLanguage.value;

        recognition.onstart = function() {
            isRecording = true;
            recordingIndicator.classList.add('active');
            startRecognitionBtn.innerHTML = '<i class="fas fa-stop"></i> 停止录音';
            statusMessage.textContent = "正在录音中，请说话...";
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            inputText.value = transcript;
            statusMessage.textContent = "识别成功：" + transcript;
            translateText();
        };

        recognition.onend = () => {
            if (isRecording) {
                recognition.start();
            } else {
                isRecording = false;
                recordingIndicator.classList.remove('active');
                startRecognitionBtn.innerHTML = '<i class="fas fa-microphone"></i> 语音输入';
                statusMessage.textContent = "录音已结束";
            }
        };

        recognition.onerror = (event) => {
            console.error('识别错误:', event.error);
            isRecording = false;
            recordingIndicator.classList.remove('active');
            startRecognitionBtn.innerHTML = '<i class="fas fa-microphone"></i> 语音输入';
            
            if(event.error === 'not-allowed') {
                alert("请在浏览器设置中允许麦克风权限！");
            } else {
                statusMessage.textContent = "识别出错：" + event.error;
            }
        };

    } catch (e) {
        console.error("语音识别初始化失败", e);
        alert("语音输入异常，请检查权限");
    }
}

// 语音输入按钮点击事件（安卓完美兼容）
function initEventListeners() {
    startRecognitionBtn.addEventListener('click', () => {
        if (!recognition) {
            initSpeechRecognition();
        }

        if (isRecording) {
            isRecording = false;
            recognition.stop();
            recordingIndicator.classList.remove('active');
            startRecognitionBtn.innerHTML = '<i class="fas fa-microphone"></i> 语音输入';
            statusMessage.textContent = "录音已停止";
        } else {
            try {
                recognition.lang = sourceLanguage.value;
                recognition.start();
            } catch (e) {
                alert("请允许麦克风权限！");
            }
        }
    });

    translateBtn.addEventListener('click', translateText);
    clearBtn.addEventListener('click', clearAll);
    swapBtn.addEventListener('click', swapLanguages);
    speakBtn.addEventListener('click', speakTranslation);
}

// 翻译功能
async function translateText() {
    const text = inputText.value.trim();
    if (!text) {
        statusMessage.textContent = "请输入或语音输入要翻译的内容";
        return;
    }

    statusMessage.textContent = "翻译中...";
    translateBtn.disabled = true;

    try {
        const response = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLanguage.value}|${targetLanguage.value}`
        );
        const data = await response.json();

        if (data.responseData && data.responseData.translatedText) {
            outputText.value = data.responseData.translatedText;
            statusMessage.textContent = "翻译完成！";
        } else {
            statusMessage.textContent = "翻译失败，请重试";
        }
    } catch (error) {
        console.error('翻译错误:', error);
        statusMessage.textContent = "翻译出错，请检查网络";
    } finally {
        translateBtn.disabled = false;
    }
}

// 语音播报
function speakTranslation() {
    const text = outputText.value.trim();
    if (!text) {
        statusMessage.textContent = "暂无翻译结果可播报";
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLanguage.value;
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
    statusMessage.textContent = "正在播放翻译...";
}

// 清空
function clearAll() {
    inputText.value = '';
    outputText.value = '';
    statusMessage.textContent = '';
}

// 切换语言
function swapLanguages() {
    const tempLang = sourceLanguage.value;
    sourceLanguage.value = targetLanguage.value;
    targetLanguage.value = tempLang;
    const tempText = inputText.value;
    inputText.value = outputText.value;
    outputText.value = tempText;
}

// 初始化语音
function initializeVoices() {
    window.speechSynthesis.getVoices();
}