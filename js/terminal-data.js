/* Terminal API call data */
var terminalCalls = (function() {
  function _J(indent, key, val, type, trail) {
    return { indent: indent, key: key, val: val, type: type || 'v', trail: trail || '' };
  }
  var _API = 'https://api.solentrex.com';
  var _SIGN = 'https://sign.solentrex.com';
  return [
    {
      cmd: ['curl -X POST ' + _API + '/v1/proposals \\',
            '  -d \'{"address":"123 Solar Ave","bill":185,"finance":"TPO"}\''],
      status: 'HTTP/1.1 200 OK', time: '42ms',
      json: [
        _J(0, null, '{', 'b'),
        _J(1, 'system_size', '8.4', 'v', ','),
        _J(1, 'panels', '21', 'v', ','),
        _J(1, 'annual_production', '13280', 'v', ','),
        _J(1, 'monthly_savings', '"$142.00"', 's', ','),
        _J(1, 'offset', '"98.2%"', 's', ','),
        _J(1, 'finance', '{', 'b'),
        _J(2, 'type', '"TPO"', 's', ','),
        _J(2, 'monthly', '"$89.00"', 's'),
        _J(1, null, '},', 'b'),
        _J(1, 'esign_url', '"' + _SIGN + '/p/a8f3..."', 's'),
        _J(0, null, '}', 'b')
      ]
    },
    {
      cmd: ['curl ' + _API + '/v1/leads/import \\',
            '  -d \'{"name":"Sarah Chen","email":"s.chen@example.co"}\''],
      status: 'HTTP/1.1 201 Created', time: '38ms',
      json: [
        _J(0, null, '{', 'b'),
        _J(1, 'lead_id', '"LD-29471"', 's', ','),
        _J(1, 'status', '"qualified"', 's', ','),
        _J(1, 'utility_detected', '"Pacific Gas and Electric"', 's', ','),
        _J(1, 'roof_segments', '3', 'v', ','),
        _J(1, 'usable_sqft', '1840', 'v', ','),
        _J(1, 'title_check', '{', 'b'),
        _J(2, 'owner', '"Sarah Chen"', 's', ','),
        _J(2, 'data_points', '83', 'v'),
        _J(1, null, '},', 'b'),
        _J(1, 'pipeline', '"new_lead"', 's'),
        _J(0, null, '}', 'b')
      ]
    },
    {
      cmd: ['curl ' + _API + '/v1/production/verify \\',
            '  -d \'{"project_id":"PJ-8812","period":"12mo"}\''],
      status: 'HTTP/1.1 200 OK', time: '156ms',
      json: [
        _J(0, null, '{', 'b'),
        _J(1, 'project', '"PJ-8812"', 's', ','),
        _J(1, 'predicted_kwh', '13280', 'v', ','),
        _J(1, 'actual_kwh', '13134', 'v', ','),
        _J(1, 'variance', '"-1.1%"', 's', ','),
        _J(1, 'panels_online', '"21/21"', 's', ','),
        _J(1, 'monthly_breakdown', '[', 'b'),
        _J(2, null, '{"month":"Jan","kwh":892},', 't'),
        _J(2, null, '{"month":"Feb","kwh":1041},', 't'),
        _J(2, null, '...', 't'),
        _J(1, null, '],', 'b'),
        _J(1, 'status', '"healthy"', 's'),
        _J(0, null, '}', 'b')
      ]
    }
  ];
})();
