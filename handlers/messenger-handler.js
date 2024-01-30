

function sendMessageAsync(tab,message) {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tab, message, (response) => {
        if (!response) {
          reject(new Error("No results"));
        } else if (response instanceof Error) {
          reject(new Error("No results"));
        } else {
          resolve(response);
        }
      });
    });
  }
  
export async function message(tab,by,type) {
  try {
    const response = await sendMessageAsync(tab,{ "by": by, "type": type });
    if (!response) {
      return;
    }

    return response;
  } catch (error) {
    console.error(error.message);
  }
}