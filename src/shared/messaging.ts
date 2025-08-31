import { Message } from './types';

export const sendMessage = <T extends Message>(message: T): Promise<any> => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
};

export const sendMessageToTab = <T extends Message>(
  tabId: number, 
  message: T
): Promise<any> => {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
};

export const onMessage = <T extends Message>(
  callback: (message: T, sender: chrome.runtime.MessageSender) => Promise<any> | any
): void => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const result = callback(message, sender);
    
    if (result instanceof Promise) {
      result
        .then(response => sendResponse({ success: true, data: response }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    } else if (result !== undefined) {
      sendResponse({ success: true, data: result });
    }
  });
};