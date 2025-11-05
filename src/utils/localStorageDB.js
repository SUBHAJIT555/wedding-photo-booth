const saveData = (key, data) => localStorage.setItem(key, JSON.stringify(data));
const getData = (key) => JSON.parse(localStorage.getItem(key));
const removeData = (key) => localStorage.removeItem(key);

export { saveData, getData, removeData };