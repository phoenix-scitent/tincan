const getActivity = config => {
	return {
		id: config.full_url,
		definition: {
		  type: config.activity_type,
		  name: config.activity_name,
		  description: { "en-US": config.activity_name }
		},
		getContext: (parentActivityId, isAssessment) => {
			return {};
		}
	};
}
export default getActivity;