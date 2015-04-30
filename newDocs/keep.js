function keepOpen(el, cat, url)
{
	if(url.search(cat) > -1)
		el.firstChild.style.display = 'block';
	else
		el.firstChild.style.display = 'block'

}