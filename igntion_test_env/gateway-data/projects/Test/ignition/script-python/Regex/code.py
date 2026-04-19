
def validation_regex(forbidden_list):
	if not forbidden_list:
		return r"^.+$" 
		
	def get_case_pattern(word):
		# Since word is already "press 1", we just build the [Pp] pairs
		# and swap literal spaces for \s+
		pattern = ""
		for char in word:
			if char.isalpha():
				pattern += "[%s%s]" % (char.upper(), char.lower())
			elif char == " ":
				pattern += r"\s+"
			else:
				pattern += char
		return pattern

	# Build the internal "OR" string
	forbidden_string = "|".join([get_case_pattern(w) for w in forbidden_list])
	
	# Wrap in the Negative Lookahead
	return r"^(?!^\s*(%s)\s*$).*$" % forbidden_string