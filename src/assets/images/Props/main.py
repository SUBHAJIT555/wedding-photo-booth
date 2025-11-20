import os
import re

folder = os.path.join(
    os.path.dirname(__file__),
    "Medium_300X"
)

for filename in os.listdir(folder):
    new_name = re.sub(r"\s*-\s*", "-", filename)

    if filename != new_name:
        os.rename(
            os.path.join(folder, filename),
            os.path.join(folder, new_name)
        )
