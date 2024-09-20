import os

let = input("Type ")

if int(let) == 0:
    os.system("git add -A")
    name = input("Name: ")
    os.system(f'git commit -m "{name}"')
    os.system("git push")
if int(let) == 1:
    os.system("start.bat")
    os.system("start1.bat")