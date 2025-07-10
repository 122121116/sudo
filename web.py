import os
import time
import sys
import json
from selenium import webdriver
from selenium.webdriver.edge.service import Service as EdgeService
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC

sys.stderr = open('selenium_edge.log', 'w', encoding='utf-8')

def select_example(driver, example_name):
    """选择下拉框中的指定题目"""
    select_elem = WebDriverWait(driver, 20).until(
        EC.presence_of_element_located((By.NAME, "Example"))
    )
    select = Select(select_elem)
    select.select_by_visible_text(example_name)
    time.sleep(1.5)  # 等待棋盘刷新

def read_sudoku_board(driver):
    """读取当前页面棋盘的81位字符串"""
    tbody = driver.find_element(By.XPATH, "/html/body/div[1]/div[4]/table[1]/tbody/tr[3]/td[1]/form/table[1]/tbody")
    cells = tbody.find_elements(By.TAG_NAME, "input")
    puzzle = ""
    for cell in cells:
        val = cell.get_attribute("value")
        puzzle += val if val and val.isdigit() else "."
    return puzzle


def fetch_single_sudoku(driver, example_name):
    """选择题目并返回其81位字符串"""
    select_example(driver, example_name)
    return read_sudoku_board(driver)


def fetch_all_sudoku(save_dir="static"):
    os.makedirs(save_dir, exist_ok=True)
    save_path = os.path.join(save_dir, "all_sudoku_examples.json")

    driver_path = r"F:\download\edgedriver_win32\msedgedriver.exe"
    service = EdgeService(driver_path)
    options = webdriver.EdgeOptions()
    options.add_argument('--proxy-server=http://127.0.0.1:7897')
    # options.add_argument('--headless')  # 如需无头可取消注释
    options.add_argument('--disable-gpu')
    options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    options.add_argument('accept-language=zh-CN,zh;q=0.9,en;q=0.8')
    options.add_argument('referer=https://www.google.com/')
    import random
    width = random.randint(1200, 1600)
    height = random.randint(800, 1000)
    options.add_argument(f'--window-size={width},{height}')

    driver = webdriver.Edge(service=service, options=options)

    # 反检测JS注入
    driver.execute_script("""
        Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
        window.navigator.chrome = {
            runtime: {}
        }
    """)

    # 2. 伪装 permissions
    driver.execute_script("""
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
            parameters.name === 'notifications' ?
                Promise.resolve({ state: Notification.permission }) :
                originalQuery(parameters)
        );
    """)

    # 4. 伪装 plugins 和 languages
    driver.execute_script("""
        Object.defineProperty(navigator, 'plugins', {
            get: () => [1, 2, 3, 4, 5],
        });
        Object.defineProperty(navigator, 'languages', {
            get: () => ['zh-CN', 'zh', 'en'],
        });
    """)

    sudoku_dict = {}
    try:
        url = "https://www.sudokuwiki.org/Sudoku.htm"
        driver.get(url)
        time.sleep(2)
        select_elem = WebDriverWait(driver, 20).until(
            EC.presence_of_element_located((By.NAME, "Example"))
        )
        select = Select(select_elem)
        all_options = [o.text.strip() for o in select.options if o.text.strip() and o.text.strip().lower() != "pick an example here"]
        for example_name in all_options:
            puzzle = fetch_single_sudoku(driver, example_name)
            sudoku_dict[example_name] = puzzle
            print(f"已获取题目: {example_name}")
        with open(save_path, "w", encoding="utf-8") as f:
            json.dump(sudoku_dict, f, ensure_ascii=False, indent=2)
        print(f"已保存所有数独题目到 {save_path}")
    finally:
        driver.quit()

if __name__ == "__main__":
    fetch_all_sudoku()
