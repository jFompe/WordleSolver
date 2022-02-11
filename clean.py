def quitar_tildes(w):
  w = w.replace('á', 'a')
  w = w.replace('é', 'e')
  w = w.replace('í', 'i')
  w = w.replace('ó', 'o')
  w = w.replace('ú', 'u')
  return w


with open("spanish.txt", "r", encoding="utf-8") as in_f:
  with open("clean.txt", "w", encoding="utf-8") as out_f:
    words = [w.strip() for w in in_f.readlines()]
    words = set([quitar_tildes(w) for w in words if len(w) == 5])
    out_f.write("\n".join(words))
