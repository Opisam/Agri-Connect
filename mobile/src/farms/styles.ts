import { StyleSheet } from 'react-native';

export const farmStyles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#f6f8f3',
  },
  scroll: {
    flexGrow: 1,
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dce5d3',
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1b2a1b',
  },
  subtitle: {
    fontSize: 15,
    color: '#4a6b4a',
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1b2a1b',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fcfdfa',
    borderWidth: 1,
    borderColor: '#dce5d3',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1b2a1b',
  },
  inputMultiline: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#2e7d32',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2e7d32',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  buttonDanger: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#b3261e',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  buttonGhostText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDangerText: {
    color: '#b3261e',
    fontSize: 14,
    fontWeight: '600',
  },
  alert: {
    backgroundColor: '#fdecea',
    borderWidth: 1,
    borderColor: 'rgba(179, 38, 30, 0.3)',
    borderRadius: 10,
    padding: 12,
  },
  alertText: {
    color: '#b3261e',
    fontSize: 14,
  },
  row: {
    gap: 8,
  },
  rowPair: {
    flexDirection: 'row',
    gap: 10,
  },
  rowItem: {
    flex: 1,
  },
  listItem: {
    backgroundColor: '#fcfdfa',
    borderWidth: 1,
    borderColor: '#dce5d3',
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1b2a1b',
  },
  itemMeta: {
    fontSize: 13,
    color: '#4a6b4a',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  actionFlex: {
    flex: 1,
  },
  empty: {
    color: '#4a6b4a',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#dce5d3',
    backgroundColor: '#fcfdfa',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipText: {
    color: '#4a6b4a',
    fontSize: 13,
  },
  chipActive: {
    borderColor: '#2e7d32',
    backgroundColor: 'rgba(46, 125, 50, 0.1)',
  },
  chipTextActive: {
    color: '#1b5e20',
    fontWeight: '600',
  },
});