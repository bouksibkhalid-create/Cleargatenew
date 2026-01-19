
import { useToast as useToastContext } from '../components/common/ToastProvider';

export const useToast = () => {
    return useToastContext();
};
