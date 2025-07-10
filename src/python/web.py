import os
import re
import requests
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
import time

def fetch_sudoku_puzzle(difficulty=2):
    """
    从 SudokuWiki 获取数独题目
    :param difficulty: 难度级别 (1=简单, 2=中等, 3=困难, 4=专家)
    :return: 包含题目、难度、唯一解标志的JSON数据
    """
    url = "http://www.sudokuwiki.org/sudoku.htm"
    
    # 模拟浏览器请求
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        # 获取生成器页面
        session = requests.Session()
        response = session.get(url, headers=headers)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 提取关键脚本
        script = soup.find("script", string=lambda t: t and "GeneratePuzzle" in t)
        
        # 构建难度参数 (DIFF1-DIFF4)
        diff_param = f"DIFF{difficulty}"
        
        # 执行JS生成题目
        gen_url = "http://www.sudokuwiki.org/Generator.ashx"
        params = {"diff": diff_param, "set": "0", "stype": "text"}
        puzzle_res = session.get(gen_url, params=params)
        
        # 解析返回数据
        if puzzle_res.status_code == 200:
            data = {
                "puzzle": puzzle_res.text.strip(),
                "difficulty": ["简单", "中等", "困难", "专家"][difficulty-1],
                "unique": True  # 该网站题目均有唯一解
            }
            return data
        
    except Exception as e:
        print(f"获取失败: {str(e)}")
    return None



def save_webpage(url, output_dir="sudoku_site"):
    """
    将整个网页及其资源保存到本地
    :param url: 要保存的网页URL
    :param output_dir: 本地保存目录
    :return: 本地HTML文件路径
    """
    # 创建保存目录
    os.makedirs(output_dir, exist_ok=True)
    
    # 获取主域名用于相对路径转换
    base_domain = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
    
    # 获取网页HTML内容
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
    }
    
    try:
        print(f"正在下载主页面: {url}")
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        # 解析HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 保存所有资源文件
        resource_types = [
            ('link', 'href', ['stylesheet', 'icon']),  # CSS, favicon
            ('script', 'src', []),                     # JS
            ('img', 'src', []),                        # 图片
            ('source', 'src', []),                     # 多媒体
            ('meta', 'content', ['og:image'])          # OpenGraph图片
        ]
        
        # 处理所有资源链接
        for tag, attr, filter_values in resource_types:
            for element in soup.find_all(tag):
                resource_url = element.get(attr)
                if not resource_url:
                    continue
                    
                # 过滤特定属性
                if filter_values:
                    prop = element.get('property') or element.get('rel')
                    if not any(value in str(prop) for value in filter_values):
                        continue
                
                # 转换相对路径为绝对URL
                if not resource_url.startswith(('http:', 'https:')):
                    resource_url = urljoin(base_domain, resource_url)
                
                # 下载资源文件
                local_path = download_resource(resource_url, output_dir)
                if local_path:
                    # 更新HTML中的资源路径为本地相对路径
                    element[attr] = os.path.relpath(local_path, output_dir)
        
        # 处理a标签的href (可选)
        for link in soup.find_all('a', href=True):
            href = link['href']
            if href.startswith(('http:', 'https:')) and base_domain in href:
                # 只处理同域名下的链接
                local_html = save_webpage(href, output_dir)
                if local_html:
                    link['href'] = os.path.relpath(local_html, output_dir)
        
        # 保存处理后的HTML文件
        page_filename = get_filename_from_url(url) or "index.html"
        html_path = os.path.join(output_dir, page_filename)
        
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(str(soup))
        
        print(f"页面已保存至: {html_path}")
        return html_path
        
    except Exception as e:
        print(f"保存网页失败: {str(e)}")
        return None

def download_resource(url, output_dir):
    """下载单个资源文件并返回本地路径"""
    try:
        # 获取文件名
        filename = get_filename_from_url(url)
        if not filename:
            return None
            
        # 创建资源子目录
        filepath = os.path.join(output_dir, filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        # 检查文件是否已存在
        if os.path.exists(filepath):
            return filepath
            
        # 下载文件
        print(f"正在下载资源: {url}")
        response = requests.get(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        })
        response.raise_for_status()
        
        # 保存文件
        with open(filepath, 'wb') as f:
            f.write(response.content)
            
        # 添加延迟避免被封
        time.sleep(0.5)
        
        return filepath
        
    except Exception as e:
        print(f"资源下载失败 [{url}]: {str(e)}")
        return None

def get_filename_from_url(url):
    """从URL中提取安全的文件名"""
    parsed = urlparse(url)
    path = parsed.path
    
    # 处理根路径
    if not path or path == '/':
        return "index.html"
    
    # 处理没有扩展名的路径
    if '.' not in os.path.basename(path):
        path += '.html'
    
    # 清理路径
    path = re.sub(r'[^\w\-_.\/]', '_', path)
    
    # 确保以斜杠开头
    if not path.startswith('/'):
        path = '/' + path
        
    return path.lstrip('/')

if __name__ == "__main__":
    # 保存整个数独百科网站到本地
    save_webpage("http://www.sudokuwiki.org/")
    
    # 可选：保存特定页面
    # save_webpage("http://www.sudokuwiki.org/Sudoku_Strategy?list")
    # save_webpage("http://www.sudokuwiki.org/sudoku.htm")

