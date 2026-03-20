function searchDish() {
  const input = document.getElementById("searchInput");
  const filter = input.value.toLowerCase();
  const ul = document.getElementById("dishList");
  const items = ul.getElementsByTagName("li");

  for (let i = 0; i < items.length; i++) {
    const text = items[i].textContent || items[i].innerText;
    if (text.toLowerCase().includes(filter)) {
      items[i].style.display = "";
    } else {
      items[i].style.display = "none";
    }
  }
}
