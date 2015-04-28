function listEntries(file, el, cat)
{
	var su = file.relName.indexOf(cat + "/");
	var su2 = ti.indexOf(".main");
	if (su > -1 && su2 < 0)
	{
		el.innerHTML = "<a href=" + file.relName + " " +
			"style='color: #00ccff'</a>";
	}
}