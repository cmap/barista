function keepOpen(el, cat, url)
{
	if(url.search(cat) > -1)
		el.nextSibling.style.display = 'block';
	else
		el.nextSibling.style.display = 'block'

}