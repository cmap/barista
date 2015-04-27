function keepOpen(el, cat, url)
{
	if(url.search(cat) < 0)
		el.nextSibling.style.display = 'none';
	else
		el.nextSibling.style.display = 'block'

}